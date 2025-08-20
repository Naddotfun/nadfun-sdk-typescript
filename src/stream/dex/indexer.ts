import type { Address, PublicClient } from 'viem'
import { createPublicClient, http, parseEventLogs, getAbiItem } from 'viem'
import { SwapEvent, PoolMetadata } from '@/types'
import { parseSwapEvent, sortEventsChronologically } from './parser'
import { v3factoryAbi } from '@/abis/v3factory'
import { v3PoolAbi } from '@/abis/v3pool'
import { CURRENT_CHAIN, CONTRACTS, NADS_FEE_TIER } from '@/constants'

/**
 * Historical indexer for Uniswap V3 Swap events
 * Efficiently processes past swap events for analysis with viem optimization
 */
export class Indexer {
  private publicClient: PublicClient
  private poolAddresses: Address[]
  private poolMetadata: Map<string, PoolMetadata> = new Map()
  private maxRetries = 3
  private retryDelay = 1000
  private maxLogsPerBatch = 5000

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
      // Create optimized HTTP PublicClient with enhanced batching and caching
      this.publicClient = createPublicClient({
        chain: CURRENT_CHAIN,
        transport: http(clientOrUrl, {
          batch: {
            batchSize: 100, // Batch up to 100 requests
            wait: 16, // Wait 16ms to collect more requests
          },
          fetchOptions: {
            // HTTP connection optimizations
            keepalive: true,
          },
          retryCount: this.maxRetries,
          retryDelay: this.retryDelay,
          timeout: 30_000, // 30 second timeout
        }),
        batch: {
          multicall: {
            batchSize: 1024, // Multicall batch size
            wait: 32, // Wait for more multicall requests
          },
        },
        cacheTime: 4_000, // Cache responses for 4 seconds
        pollingInterval: 1_000, // Poll every 1 second when needed
      })
    } else {
      // Use provided PublicClient
      this.publicClient = clientOrUrl
    }
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
   * Fetch swap events for a specific block range with HTTP optimization
   * Returns events sorted chronologically
   */
  async fetchEvents(fromBlock: number, toBlock: number): Promise<SwapEvent[]> {
    if (this.poolAddresses.length === 0) {
      return []
    }

    return this.withRetry(async () => {
      const logs = await this.publicClient.getLogs({
        address: this.poolAddresses as `0x${string}`[],
        event: getAbiItem({
          abi: v3PoolAbi,
          name: 'Swap',
        }) as any, // Type assertion for viem compatibility
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        strict: true, // Only return valid logs
      })

      // Check if we hit the log limit and need to split the range
      if (logs.length >= this.maxLogsPerBatch) {
        console.warn(`⚠️  Hit max logs limit (${logs.length}). Consider reducing block range.`)
      }

      // Use viem's parseEventLogs for better performance
      const parsedLogs = parseEventLogs({
        abi: v3PoolAbi,
        logs: logs,
        eventName: 'Swap',
      })

      const events: SwapEvent[] = []
      for (const parsedLog of parsedLogs) {
        const event = parseSwapEvent(parsedLog as any)
        if (event) {
          events.push(event)
        }
      }

      return sortEventsChronologically(events)
    }, `fetchEvents(${fromBlock}-${toBlock})`)
  }

  /**
   * Fetch all historical events with intelligent batching and HTTP optimization
   * Automatically adjusts batch size based on response size
   */
  async fetchAllEvents(
    startBlock: number,
    batchSize: number = 2000, // Larger default batch for HTTP
    maxConcurrency: number = 3 // Limit concurrent requests
  ): Promise<SwapEvent[]> {
    const allEvents: SwapEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching events from block ${startBlock} to ${targetBlock}`)
    console.log(`🔧 Using batch size: ${batchSize}, max concurrency: ${maxConcurrency}`)

    const batches: Array<{ from: number; to: number }> = []

    // Pre-calculate all batches
    while (currentBlock <= targetBlock) {
      const toBlock = Math.min(currentBlock + batchSize, targetBlock)
      batches.push({ from: currentBlock, to: toBlock })
      currentBlock = toBlock + 1
    }

    console.log(`📦 Created ${batches.length} batches`)

    // Process batches with controlled concurrency
    let processedBatches = 0
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const batchSlice = batches.slice(i, i + maxConcurrency)

      const batchPromises = batchSlice.map(async batch => {
        console.log(`  📄 Processing blocks ${batch.from} to ${batch.to}...`)

        try {
          const events = await this.fetchEvents(batch.from, batch.to)
          processedBatches++

          const progress = ((processedBatches / batches.length) * 100).toFixed(1)
          console.log(
            `  ✅ Batch ${processedBatches}/${batches.length} (${progress}%) - Found ${events.length} events`
          )

          return events
        } catch (error) {
          console.error(`  ❌ Batch failed ${batch.from}-${batch.to}:`, error)
          throw error
        }
      })

      const batchResults = await Promise.all(batchPromises)

      for (const events of batchResults) {
        allEvents.push(...events)
      }

      // Add small delay between batch groups to be respectful to RPC
      if (i + maxConcurrency < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Fetched ${allEvents.length} swap events across ${batches.length} batches`)

    // Final sort to ensure chronological order across all batches
    return sortEventsChronologically(allEvents)
  }

  /**
   * HTTP retry wrapper with exponential backoff for better HTTP reliability
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= this.maxRetries) {
        console.error(`❌ ${context} failed after ${this.maxRetries} attempts:`, error)
        throw error
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
      console.warn(`⚠️  ${context} attempt ${attempt} failed, retrying in ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.withRetry(fn, context, attempt + 1)
    }
  }

  /**
   * Enhanced health check for HTTP performance monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    rpcLatency: number
    poolCount: number
    message: string
  }> {
    try {
      const startTime = Date.now()
      await this.publicClient.getBlockNumber()
      const rpcLatency = Date.now() - startTime

      let status: 'healthy' | 'degraded' | 'unhealthy'
      let message: string

      if (rpcLatency < 200 && this.poolAddresses.length > 0) {
        status = 'healthy'
        message = `HTTP indexer ready with ${this.poolAddresses.length} pools`
      } else if (rpcLatency < 1000 && this.poolAddresses.length > 0) {
        status = 'degraded'
        message = `High HTTP latency (${rpcLatency}ms) but functional`
      } else {
        status = 'unhealthy'
        message =
          this.poolAddresses.length === 0
            ? 'No pools configured'
            : `Very high HTTP latency (${rpcLatency}ms)`
      }

      return {
        status,
        rpcLatency,
        poolCount: this.poolAddresses.length,
        message,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        rpcLatency: -1,
        poolCount: this.poolAddresses.length,
        message: `HTTP RPC connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Get optimal batch size for HTTP requests based on block range
   */
  getOptimalBatchSize(blockRange: number): number {
    // Conservative batch sizes for HTTP to avoid timeout/limit issues
    if (blockRange <= 1000) return 500
    if (blockRange <= 10000) return 1000
    if (blockRange <= 100000) return 2000
    return 5000
  }

  /**
   * Get all pool addresses being monitored
   */
  getPoolAddresses(): Address[] {
    return [...this.poolAddresses]
  }

  /**
   * Add pool addresses to monitor with validation
   */
  addPoolAddresses(addresses: Address[]): void {
    const newPools = addresses.filter(addr => !this.poolAddresses.includes(addr))
    this.poolAddresses.push(...newPools)
    console.log(`➕ Added ${newPools.length} new pools (total: ${this.poolAddresses.length})`)
  }

  /**
   * Remove pool addresses from monitoring
   */
  removePoolAddresses(addresses: Address[]): void {
    const initialCount = this.poolAddresses.length
    this.poolAddresses = this.poolAddresses.filter(addr => !addresses.includes(addr))
    const removedCount = initialCount - this.poolAddresses.length
    console.log(`➖ Removed ${removedCount} pools (total: ${this.poolAddresses.length})`)
  }

  /**
   * Get pool metadata (if available)
   */
  getPoolMetadata(poolAddress: Address): PoolMetadata | undefined {
    return this.poolMetadata.get(poolAddress.toLowerCase())
  }

  /**
   * Clear internal cache and reset state
   */
  reset(): void {
    this.poolMetadata.clear()
    console.log('🔄 Indexer state reset')
  }
}
