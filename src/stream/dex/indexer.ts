import type { Address, PublicClient } from 'viem'
import { createPublicClient, http, toEventSelector, parseAbiItem } from 'viem'
import { SwapEvent, PoolMetadata } from '@/types'
import { parseSwapEvent, sortEventsChronologically } from './parser'
import { CURRENT_CHAIN } from '@/constants'

/**
 * Historical indexer for Uniswap V3 Swap events
 * Efficiently processes past swap events for analysis
 */
export class Indexer {
  private publicClient: PublicClient
  private poolAddresses: Address[]
  private poolMetadata: Map<string, PoolMetadata> = new Map()

  /**
   * Create indexer with RPC URL and pool addresses (recommended)
   */
  constructor(rpcUrl: string, poolAddresses: Address[])
  /**
   * Create indexer with existing PublicClient and pool addresses (advanced usage)
   */
  constructor(publicClient: PublicClient, poolAddresses: Address[])
  constructor(clientOrUrl: string | PublicClient, poolAddresses: Address[]) {
    if (typeof clientOrUrl === 'string') {
      // Create PublicClient internally from RPC URL
      this.publicClient = createPublicClient({
        chain: CURRENT_CHAIN,
        transport: http(clientOrUrl),
      })
    } else {
      // Use provided PublicClient
      this.publicClient = clientOrUrl
    }
    this.poolAddresses = poolAddresses
  }

  /**
   * Create indexer by discovering pools for token addresses
   * Uses NADS standard 10_000 fee tier (1%)
   * Note: Requires factory and WMON addresses to be configured
   */
  static async discoverPoolsForTokens(rpcUrl: string, tokenAddresses: Address[]): Promise<Indexer> {
    console.log(`🔍 Discovering pools for ${tokenAddresses.length} tokens...`)

    // Pool discovery requires factory contract integration
    const poolAddresses: Address[] = []

    console.log(`🔍 Pool discovery not yet implemented - using empty pool list`)
    return new Indexer(rpcUrl, poolAddresses)
  }

  /**
   * Create indexer by discovering pool for a single token
   */
  static async discoverPoolForToken(rpcUrl: string, tokenAddress: Address): Promise<Indexer> {
    return Indexer.discoverPoolsForTokens(rpcUrl, [tokenAddress])
  }

  /**
   * Fetch swap events for a specific block range
   * Returns events sorted chronologically
   */
  async fetchEvents(fromBlock: number, toBlock: number): Promise<SwapEvent[]> {
    if (this.poolAddresses.length === 0) {
      return []
    }

    const swapTopic = toEventSelector(
      parseAbiItem(
        'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
      )
    )

    const logs = await this.publicClient.getLogs({
      address: this.poolAddresses as `0x${string}`[],
      events: [swapTopic],
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })

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
   * Fetch all historical events from start_block to current block
   * This will automatically handle batching
   */
  async fetchAllEvents(startBlock: number, batchSize: number = 1000): Promise<SwapEvent[]> {
    const allEvents: SwapEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching events from block ${startBlock} to ${targetBlock}`)

    while (currentBlock <= targetBlock) {
      const toBlock = Math.min(currentBlock + batchSize, targetBlock)
      console.log(`  Processing blocks ${currentBlock} to ${toBlock}...`)

      const events = await this.fetchEvents(currentBlock, toBlock)
      allEvents.push(...events)

      if (toBlock >= targetBlock) {
        break
      }
      currentBlock = toBlock + 1
    }

    console.log(`✅ Fetched ${allEvents.length} swap events`)
    return allEvents
  }

  /**
   * Get all pool addresses being monitored
   */
  getPoolAddresses(): Address[] {
    return this.poolAddresses
  }

  /**
   * Add pool addresses to monitor
   */
  addPoolAddresses(addresses: Address[]): void {
    this.poolAddresses.push(...addresses)
  }

  /**
   * Get pool metadata (if available)
   */
  getPoolMetadata(poolAddress: Address): PoolMetadata | undefined {
    return this.poolMetadata.get(poolAddress.toLowerCase())
  }
}
