import type { PublicClient } from 'viem'
import { CurveEventType, BondingCurveEvent } from './types'
import { CONTRACTS } from '@/constants'
import {
  parseBondingCurveEvent,
  getCurveEventSignatures,
  sortEventsChronologically,
} from './parser'

/**
 * Event indexer for fetching historical bonding curve events in batches
 */
export class Indexer {
  private publicClient: PublicClient
  private bondingCurveAddress: string

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient
    this.bondingCurveAddress = CONTRACTS.MONAD_TESTNET.CURVE
  }

  /**
   * Fetch events for a specific block range
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

    const logs = await this.publicClient.getLogs({
      address: this.bondingCurveAddress as `0x${string}`,
      events: signatures,
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })

    const events: BondingCurveEvent[] = []
    const tokenSet = tokenFilter ? new Set(tokenFilter.map(t => t.toLowerCase())) : null

    for (const log of logs) {
      const event = parseBondingCurveEvent(log)

      if (event) {
        // Apply token filter if specified
        const token = event.token.toLowerCase()
        if (tokenSet && !tokenSet.has(token)) {
          continue
        }
        events.push(event)
      }
    }

    return sortEventsChronologically(events)
  }

  /**
   * Fetch all historical events from start_block to current block
   * This will automatically handle batching
   */
  async fetchAllEvents(
    startBlock: number,
    batchSize: number = 1000,
    eventTypes: CurveEventType[] = [CurveEventType.Buy, CurveEventType.Sell],
    tokenFilter?: string[]
  ): Promise<BondingCurveEvent[]> {
    const allEvents: BondingCurveEvent[] = []
    let currentBlock = startBlock
    const targetBlock = Number(await this.publicClient.getBlockNumber())

    console.log(`📊 Fetching events from block ${startBlock} to ${targetBlock}`)

    while (currentBlock <= targetBlock) {
      const toBlock = Math.min(currentBlock + batchSize, targetBlock)
      console.log(`  Processing blocks ${currentBlock} to ${toBlock}...`)

      const events = await this.fetchEvents(currentBlock, toBlock, eventTypes, tokenFilter)
      allEvents.push(...events)

      if (toBlock >= targetBlock) {
        break
      }
      currentBlock = toBlock + 1
    }

    console.log(`✅ Fetched ${allEvents.length} bonding curve events`)
    return allEvents
  }
}
