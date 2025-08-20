import type { PublicClient } from 'viem'
import { createPublicClient, http, parseEventLogs, getAbiItem } from 'viem'
import { CurveEventType, BondingCurveEvent } from '@/types'
import { CONTRACTS, CURRENT_CHAIN } from '@/constants'
import { curveAbi } from '@/abis/curve'
import {
  parseBondingCurveEvent,
  getCurveEventSignatures,
  sortEventsChronologically,
} from './parser'

/**
 * Event indexer for fetching historical bonding curve events with HTTP optimization
 */
export class Indexer {
  private publicClient: PublicClient
  private bondingCurveAddress: string
  private maxRetries = 3
  private retryDelay = 1000
  private maxLogsPerBatch = 5000

  /**
   * Create indexer with RPC URL (recommended)
   */
  constructor(rpcUrl: string)
  /**
   * Create indexer with existing PublicClient (advanced usage)
   */
  constructor(publicClient: PublicClient)
  constructor(clientOrUrl: string | PublicClient) {
    if (typeof clientOrUrl === 'string') {
      // Create optimized HTTP PublicClient for bonding curve indexing
      this.publicClient = createPublicClient({
        chain: CURRENT_CHAIN,
        transport: http(clientOrUrl, {
          batch: {
            batchSize: 50, // Smaller batches for curve events
            wait: 20, // Wait 20ms for batching
          },
          fetchOptions: {
            keepalive: true,
          },
          retryCount: this.maxRetries,
          retryDelay: this.retryDelay,
          timeout: 30_000,
        }),
        batch: {
          multicall: {
            batchSize: 512,
            wait: 25,
          },
        },
        cacheTime: 4_000,
        pollingInterval: 1_000,
      })
    } else {
      // Use provided PublicClient
      this.publicClient = clientOrUrl
    }
    this.bondingCurveAddress = CONTRACTS.MONAD_TESTNET.CURVE
  }

  /**
   * HTTP retry wrapper with exponential backoff
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

      const delay = this.retryDelay * Math.pow(2, attempt - 1)
      console.warn(`⚠️  ${context} attempt ${attempt} failed, retrying in ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.withRetry(fn, context, attempt + 1)
    }
  }

  /**
   * Fetch events for a specific block range with HTTP optimization
   * Returns events sorted chronologically
   */
  async fetchEvents(
    fromBlock: number,
    toBlock: number,
    eventTypes: CurveEventType[] = [CurveEventType.Buy, CurveEventType.Sell],
    tokenFilter?: string[]
  ): Promise<BondingCurveEvent[]> {
    const signatures = getCurveEventSignatures(eventTypes)

    if (signatures.length === 0) {
      return []
    }

    return this.withRetry(async () => {
      const logs = await this.publicClient.getLogs({
        address: this.bondingCurveAddress as `0x${string}`,
        events: signatures,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        strict: true, // Only return valid logs
      })

      // Check for potential log limit issues
      if (logs.length >= this.maxLogsPerBatch) {
        console.warn(
          `⚠️  Hit max logs limit for curve events (${logs.length}). Consider reducing block range.`
        )
      }

      const events: BondingCurveEvent[] = []
      const tokenSet = tokenFilter ? new Set(tokenFilter.map(t => t.toLowerCase())) : null

      // Process logs with better error handling
      for (const log of logs) {
        try {
          const event = parseBondingCurveEvent(log)

          if (event) {
            // Apply token filter if specified
            const token = event.token.toLowerCase()
            if (tokenSet && !tokenSet.has(token)) {
              continue
            }
            events.push(event)
          }
        } catch (error) {
          console.warn(`⚠️  Failed to parse curve event log:`, error)
          // Continue processing other logs
        }
      }

      return sortEventsChronologically(events)
    }, `fetchCurveEvents(${fromBlock}-${toBlock})`)
  }

  /**
   * Fetch all historical events with intelligent HTTP batching
   */
  async fetchAllEvents(
    startBlock: number,
    batchSize: number = 1500, // Optimized for bonding curve events
    eventTypes: CurveEventType[] = [CurveEventType.Buy, CurveEventType.Sell],
    tokenFilter?: string[],
    maxConcurrency: number = 2 // Conservative concurrency for curve events
  ): Promise<BondingCurveEvent[]> {
    const allEvents: BondingCurveEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching curve events from block ${startBlock} to ${targetBlock}`)
    console.log(`🎯 Event types: ${eventTypes.join(', ')}`)
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
          const events = await this.fetchEvents(batch.from, batch.to, eventTypes, tokenFilter)
          processedBatches++

          const progress = ((processedBatches / batches.length) * 100).toFixed(1)
          console.log(
            `  ✅ Batch ${processedBatches}/${batches.length} (${progress}%) - Found ${events.length} curve events`
          )

          return events
        } catch (error) {
          console.error(`  ❌ Curve batch failed ${batch.from}-${batch.to}:`, error)
          throw error
        }
      })

      const batchResults = await Promise.all(batchPromises)

      for (const events of batchResults) {
        allEvents.push(...events)
      }

      // Small delay between batch groups for HTTP rate limiting
      if (i + maxConcurrency < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    console.log(
      `✅ Fetched ${allEvents.length} bonding curve events across ${batches.length} batches`
    )

    return sortEventsChronologically(allEvents)
  }

  /**
   * Health check for curve indexer HTTP performance
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    rpcLatency: number
    curveAddress: string
    message: string
  }> {
    try {
      const startTime = Date.now()
      await this.publicClient.getBlockNumber()
      const rpcLatency = Date.now() - startTime

      let status: 'healthy' | 'degraded' | 'unhealthy'
      let message: string

      if (rpcLatency < 200) {
        status = 'healthy'
        message = `HTTP curve indexer ready (${rpcLatency}ms)`
      } else if (rpcLatency < 1000) {
        status = 'degraded'
        message = `High HTTP latency (${rpcLatency}ms) but functional`
      } else {
        status = 'unhealthy'
        message = `Very high HTTP latency (${rpcLatency}ms)`
      }

      return {
        status,
        rpcLatency,
        curveAddress: this.bondingCurveAddress,
        message,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        rpcLatency: -1,
        curveAddress: this.bondingCurveAddress,
        message: `HTTP RPC connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Get optimal batch size for curve events based on block range
   */
  getOptimalBatchSize(blockRange: number): number {
    // Curve events are generally less frequent, so we can use larger batches
    if (blockRange <= 5000) return 1000
    if (blockRange <= 50000) return 2500
    return 5000
  }

  /**
   * Get bonding curve contract address
   */
  getBondingCurveAddress(): string {
    return this.bondingCurveAddress
  }
}
