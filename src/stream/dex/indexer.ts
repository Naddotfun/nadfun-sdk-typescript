import type { Address, PublicClient, Log } from 'viem'
import { createPublicClient, http } from 'viem'
import { SwapEvent } from '@/types'
import { parseSwapEvent, sortEventsChronologically } from './parser'
import { v3factoryAbi } from '@/abis/v3factory'
import { CURRENT_CHAIN, CONTRACTS, NADS_FEE_TIER } from '@/constants'

/**
 * Event indexer for fetching historical Uniswap V3 swap events
 *
 * Simple, efficient implementation following viem patterns
 */
export class Indexer {
  public readonly publicClient: PublicClient
  private readonly poolAddresses: Address[]

  constructor(rpcUrl: string, poolAddresses: Address[]) {
    const client = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: http(rpcUrl),
    })
    this.publicClient = client

    this.poolAddresses = poolAddresses
  }

  /**
   * Create indexer by discovering pools for token addresses
   * Uses NADS standard fee tier to find token-WMON pools
   */
  static async discoverPoolsForTokens(rpcUrl: string, tokenAddresses: Address[]): Promise<Indexer> {
    console.log(`🔍 Discovering pools for ${tokenAddresses.length} tokens...`)

    const poolAddresses: Address[] = await Indexer.findPoolsForTokens(rpcUrl, tokenAddresses)
    console.log(`✅ Found ${poolAddresses.length} pools`)

    return new Indexer(rpcUrl, poolAddresses)
  }

  /**
   * Create indexer by discovering pool for a single token
   */
  static async discoverPoolForToken(rpcUrl: string, tokenAddress: Address): Promise<Indexer> {
    return Indexer.discoverPoolsForTokens(rpcUrl, [tokenAddress])
  }

  /**
   * Find pool addresses for given token addresses using V3 Factory
   * Each token is paired with WMON using NADS fee tier
   */
  private static async findPoolsForTokens(
    rpcUrl: string,
    tokenAddresses: Address[]
  ): Promise<Address[]> {
    const client = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: http(rpcUrl),
    })

    const wmonAddress = CONTRACTS.MONAD_TESTNET.WMON as Address
    const factoryAddress = CONTRACTS.MONAD_TESTNET.V3_FACTORY as Address
    const poolAddresses: Address[] = []

    for (const tokenAddress of tokenAddresses) {
      try {
        // Skip if token is WMON itself
        if (tokenAddress.toLowerCase() === wmonAddress.toLowerCase()) {
          console.log(`⏭️  Skipping WMON token itself: ${tokenAddress}`)
          continue
        }

        // Sort token addresses (Uniswap V3 requirement)
        const [token0, token1] =
          tokenAddress.toLowerCase() < wmonAddress.toLowerCase()
            ? [tokenAddress, wmonAddress]
            : [wmonAddress, tokenAddress]

        console.log(`🔍 Looking for pool: ${token0} / ${token1} (fee: ${NADS_FEE_TIER})`)

        // Call V3 Factory getPool function
        const poolAddress = (await client.readContract({
          address: factoryAddress,
          abi: v3factoryAbi,
          functionName: 'getPool',
          args: [token0, token1, NADS_FEE_TIER],
        })) as Address

        // Check if pool exists (not zero address)
        if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Found pool: ${poolAddress}`)
          poolAddresses.push(poolAddress)
        } else {
          console.log(`❌ No pool found for ${tokenAddress}`)
        }
      } catch (error) {
        console.error(`❌ Error finding pool for ${tokenAddress}:`, error)
      }
    }

    return poolAddresses
  }

  /**
   * Fetch swap events for a specific block range
   * Returns events sorted chronologically
   */
  async fetchEvents(fromBlock: number, toBlock: number): Promise<SwapEvent[]> {
    if (this.poolAddresses.length === 0) {
      return []
    }

    // Get all logs from the pool addresses
    const logs = await this.publicClient.getLogs({
      address: this.poolAddresses as `0x${string}`[],
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })

    // Process logs
    return this.processLogs(logs as Log[])
  }

  /**
   * Process raw logs into swap events
   */
  private processLogs(logs: Log[]): SwapEvent[] {
    const events: SwapEvent[] = []

    for (const log of logs) {
      const event = parseSwapEvent(log)
      if (event) {
        events.push(event)
      }
    }

    return sortEventsChronologically(events)
  }

  /**
   * Fetch all historical events with automatic batching
   */
  async fetchAllEvents(startBlock: number, batchSize: number = 2000): Promise<SwapEvent[]> {
    const allEvents: SwapEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching events from block ${startBlock} to ${targetBlock}`)

    while (currentBlock <= targetBlock) {
      const toBlock = Math.min(currentBlock + batchSize - 1, targetBlock)

      console.log(`  📄 Processing blocks ${currentBlock} to ${toBlock}...`)

      const events = await this.fetchEvents(currentBlock, toBlock)

      allEvents.push(...events)

      if (toBlock >= targetBlock) break
      currentBlock = toBlock + 1
    }

    console.log(`✅ Fetched ${allEvents.length} events`)

    return sortEventsChronologically(allEvents)
  }

  /**
   * Get pool addresses being monitored
   */
  getPoolAddresses(): Address[] {
    return [...this.poolAddresses]
  }
}
