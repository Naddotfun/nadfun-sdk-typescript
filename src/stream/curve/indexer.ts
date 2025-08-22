import type { PublicClient, Log } from 'viem'
import { createPublicClient, http } from 'viem'
import { CurveEventType, BondingCurveEvent } from '@/types'
import { CONTRACTS, CURRENT_CHAIN } from '@/constants'
import { parseBondingCurveEvent, sortEventsChronologically } from './parser'

/**
 * Event indexer for fetching historical bonding curve events
 *
 * Simple, efficient implementation following viem patterns
 */
export class Indexer {
  public readonly publicClient: PublicClient
  private readonly bondingCurveAddress: string

  constructor(rpcUrl: string) {
    const client = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: http(rpcUrl),
    })
    this.publicClient = client

    this.bondingCurveAddress = CONTRACTS.MONAD_TESTNET.CURVE
  }

  /**
   * Fetch events for a specific block range
   * Returns events sorted chronologically
   */
  async fetchEvents(
    fromBlock: number,
    toBlock: number,
    eventTypes?: CurveEventType[],
    tokenFilter?: string[]
  ): Promise<BondingCurveEvent[]> {
    // Get all logs from the bonding curve contract
    const logs = await this.publicClient.getLogs({
      address: this.bondingCurveAddress as `0x${string}`,
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })

    // Process logs
    return this.processLogs(logs as Log[], eventTypes, tokenFilter)
  }

  /**
   * Process raw logs into bonding curve events
   */
  private processLogs(
    logs: Log[],
    eventTypes?: CurveEventType[],
    tokenFilter?: string[]
  ): BondingCurveEvent[] {
    const events: BondingCurveEvent[] = []
    const tokenSet = tokenFilter ? new Set(tokenFilter.map(t => t.toLowerCase())) : null
    const eventTypeSet = eventTypes ? new Set(eventTypes) : null

    for (const log of logs) {
      try {
        const event = parseBondingCurveEvent(log)

        if (!event) continue

        // Apply event type filter
        if (eventTypeSet && !eventTypeSet.has(event.type as CurveEventType)) {
          continue
        }

        // Apply token filter
        if (tokenSet && !tokenSet.has(event.token.toLowerCase())) {
          continue
        }

        events.push(event)
      } catch (error: any) {
        // Skip invalid logs silently
        console.error('Error parsing bonding curve event:', error)
        continue
      }
    }

    return sortEventsChronologically(events)
  }

  /**
   * Fetch all historical events with automatic batching
   */
  async fetchAllEvents(
    startBlock: number,
    batchSize: number = 2000,
    eventTypes?: CurveEventType[],
    tokenFilter?: string[]
  ): Promise<BondingCurveEvent[]> {
    const allEvents: BondingCurveEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching events from block ${startBlock} to ${targetBlock}`)

    while (currentBlock <= targetBlock) {
      const toBlock = Math.min(currentBlock + batchSize - 1, targetBlock)

      console.log(`  📄 Processing blocks ${currentBlock} to ${toBlock}...`)

      const events = await this.fetchEvents(currentBlock, toBlock, eventTypes, tokenFilter)

      allEvents.push(...events)

      if (toBlock >= targetBlock) break
      currentBlock = toBlock + 1
    }

    console.log(`✅ Fetched ${allEvents.length} events`)

    return sortEventsChronologically(allEvents)
  }

  /**
   * Get bonding curve contract address
   */
  getBondingCurveAddress(): string {
    return this.bondingCurveAddress
  }
}
