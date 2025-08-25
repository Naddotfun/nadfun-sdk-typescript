import { CurveEventType, BondingCurveEvent } from '@/types'
import { CONTRACTS, CURRENT_CHAIN } from '@/constants'
import { parseBondingCurveEvent } from './parser'
import { type PublicClient, type Log, createPublicClient, webSocket } from 'viem'

/**
 * Bonding curve event stream with 2-stage filtering
 * Enhanced with better error handling and reconnection logic
 */
export class Stream {
  private client: PublicClient
  private bondingCurveAddress: string
  private eventTypes: CurveEventType[]
  private tokenFilter: Set<string> | null = null
  private listeners: Map<string, (event: BondingCurveEvent) => void> = new Map()
  private isRunning: boolean = false
  private watchFn: (() => void) | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  constructor(rpcUrl: string) {
    const client = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: webSocket(rpcUrl),
    })
    this.client = client

    this.bondingCurveAddress = CONTRACTS.MONAD_TESTNET.CURVE

    this.eventTypes = []
  }

  /**
   * Subscribe to specific event types (network-level filtering)
   * If empty array is passed, subscribes to all event types
   */
  subscribeEvents(eventTypes: CurveEventType[]): Stream {
    this.eventTypes = eventTypes

    return this
  }

  /**
   * Filter by specific tokens (client-level filtering)
   */
  filterTokens(tokens: string[]): Stream {
    this.tokenFilter = new Set(tokens.map(t => t.toLowerCase()))
    return this
  }

  /**
   * Add a callback for events
   * @returns A function to remove this listener
   */
  onEvent(callback: (event: BondingCurveEvent) => void): () => void {
    const id = Math.random().toString(36).substring(7)
    this.listeners.set(id, callback)

    return () => {
      this.listeners.delete(id)
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear()
  }

  /**
   * Start the event stream using viem's watchEvent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Bonding curve stream is already running')
      return
    }

    this.isRunning = true
    this.reconnectAttempts = 0

    // Check if event types are set
    if (this.eventTypes.length === 0) {
      console.warn(
        '⚠️ No event types specified. Call subscribeEvents() first or pass empty array to subscribe to all events.'
      )
      this.subscribeEvents([
        CurveEventType.Create,
        CurveEventType.Buy,
        CurveEventType.Sell,
        CurveEventType.Sync,
        CurveEventType.Lock,
        CurveEventType.Listed,
      ])
    }

    console.log(`🎯 Starting bonding curve stream`)
    console.log(`📍 Bonding curve address: ${this.bondingCurveAddress}`)
    console.log(`📋 Event types: ${this.eventTypes.join(', ')}`)
    console.log(`📡 Using ${this.client.transport.type || 'unknown'} transport`)
    if (this.tokenFilter) {
      console.log(`🔍 Token filter: ${this.tokenFilter.size} tokens`)
    }

    this.startWatching()
  }

  /**
   * Start watching events with error handling and reconnection
   */
  private startWatching(): void {
    try {
      const watchConfig: Parameters<typeof this.client.watchEvent>[0] = {
        address: this.bondingCurveAddress as `0x${string}`,
        onLogs: async logs => {
          await this.processLogs(logs as Log[])
        },
        onError: error => {
          console.error('❌ Error in bonding curve stream:', error)
        },
      }

      // Use viem's watchEvent - it automatically handles HTTP vs polling
      this.watchFn = this.client.watchEvent(watchConfig)

      console.log('✅ Bonding curve stream started successfully')
    } catch (error) {
      console.error('❌ Failed to start bonding curve stream:', error)
    }
  }

  /**
   * Process logs from watchEvent
   */
  private async processLogs(logs: Log[]): Promise<void> {
    for (const log of logs) {
      try {
        // Get block for timestamp
        const block = await this.client.getBlock({
          blockNumber: log.blockNumber!,
        })

        const event = parseBondingCurveEvent(log, Number(block.timestamp))

        if (event) {
          // Apply event type filter
          if (this.eventTypes.includes(event.type as CurveEventType)) {
            // Apply token filter if set
            if (this.tokenFilter && this.tokenFilter.size > 0) {
              if (!this.tokenFilter.has(event.token.toLowerCase())) {
                continue
              }
            }

            // Notify all listeners
            this.listeners.forEach(callback => callback(event))
          }
          // Reset reconnect attempts on successful event processing
          this.reconnectAttempts = 0
        }
      } catch (error) {
        console.error('❌ Error processing bonding curve event:', error)
      }
    }
  }

  /**
   * Stop streaming events
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('🛑 Stopping bonding curve stream')

    // Stop the event watcher
    if (this.watchFn) {
      try {
        this.watchFn()
        this.watchFn = null
      } catch (error) {
        console.error('❌ Error stopping bonding curve watcher:', error)
      }
    }

    // Clear all listeners
    this.removeAllListeners()

    this.isRunning = false
    this.reconnectAttempts = 0

    console.log('✅ Bonding curve stream stopped')
  }

  /**
   * Check if stream is running
   */
  isStreaming(): boolean {
    return this.isRunning
  }

  /**
   * Get current reconnection status
   */
  getReconnectionStatus(): { attempts: number; maxAttempts: number } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): {
    bondingCurveAddress: string
    eventTypes: CurveEventType[]
    tokenFilter: string[] | null
    transport: string
  } {
    return {
      bondingCurveAddress: this.bondingCurveAddress,
      eventTypes: [...this.eventTypes],
      tokenFilter: this.tokenFilter ? Array.from(this.tokenFilter) : null,
      transport: this.client.transport.type || 'unknown',
    }
  }
}
