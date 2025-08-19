import { createPublicClient, http, webSocket, parseEventLogs, type Log } from 'viem'
import { DexEventType, SwapEvent } from './types'
import { v3PoolAbi } from '@/abis/v3pool'
import type { Address, PublicClient } from 'viem'

/**
 * Real-time stream for Uniswap V3 Swap events
 * Monitors specified pool addresses for swap activity using viem's watchContractEvent
 */
export class Stream {
  private client: PublicClient
  private poolAddresses: Address[]
  private listeners: Map<string, (event: SwapEvent) => void> = new Map()
  private isRunning: boolean = false
  private unwatchFunctions: (() => void)[] = []
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  constructor(client: PublicClient, poolAddresses: Address[]) {
    this.client = client
    this.poolAddresses = poolAddresses
  }

  /**
   * Create a WebSocket-based stream for better real-time performance
   */
  static async createWebSocket(wsUrl: string, poolAddresses: Address[]): Promise<Stream> {
    try {
      const client = createPublicClient({
        transport: webSocket(wsUrl),
      })
      return new Stream(client, poolAddresses)
    } catch (error) {
      console.warn('WebSocket creation failed, falling back to HTTP:', error)
      // Fallback to HTTP
      const client = createPublicClient({
        transport: http(wsUrl.replace('wss:', 'https:').replace('ws:', 'http:')),
      })
      return new Stream(client, poolAddresses)
    }
  }

  /**
   * Create HTTP-based stream
   */
  static async createHttp(rpcUrl: string, poolAddresses: Address[]): Promise<Stream> {
    const client = createPublicClient({
      transport: http(rpcUrl),
    })
    return new Stream(client, poolAddresses)
  }

  /**
   * Create stream by discovering pools for token addresses
   * Note: Requires factory and WMON addresses to be configured
   */
  static async discoverPoolsForTokens(
    client: PublicClient,
    tokenAddresses: Address[]
  ): Promise<Stream> {
    console.log(`🔍 Discovering pools for ${tokenAddresses.length} tokens...`)
    const poolAddresses: Address[] = []
    console.log(`🔍 Pool discovery not yet implemented - using empty pool list`)

    return new Stream(client, poolAddresses)
  }

  /**
   * Create WebSocket stream by discovering pools for token addresses
   */
  static async discoverPoolsForTokensWs(wsUrl: string, tokenAddresses: Address[]): Promise<Stream> {
    const client = createPublicClient({
      transport: webSocket(wsUrl),
    })
    return Stream.discoverPoolsForTokens(client, tokenAddresses)
  }

  /**
   * Add a callback for swap events
   * @returns Function to remove this listener
   */
  onSwap(callback: (event: SwapEvent) => void): () => void {
    const id = Math.random().toString(36).substring(7)
    this.listeners.set(id, callback)

    // Return unsubscribe function
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
   * Start streaming swap events using viem's watchContractEvent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Stream is already running')
      return
    }

    if (this.poolAddresses.length === 0) {
      console.log('❌ No pool addresses to monitor')
      return
    }

    this.isRunning = true
    this.reconnectAttempts = 0

    console.log(`🎯 Starting DEX swap stream for ${this.poolAddresses.length} pools`)
    console.log(`📡 Using ${this.client.transport.type || 'unknown'} transport`)

    // Start watching events for each pool
    for (const poolAddress of this.poolAddresses) {
      this.watchPoolEvents(poolAddress)
    }
  }

  /**
   * Watch swap events for a specific pool
   */
  private watchPoolEvents(poolAddress: Address): void {
    try {
      console.log(`👀 Watching pool: ${poolAddress}`)

      const watchConfig: Parameters<typeof this.client.watchContractEvent>[0] = {
        address: poolAddress,
        abi: v3PoolAbi,
        eventName: 'Swap',
        onLogs: async logs => {
          await this.processSwapLogs(logs as Log[], poolAddress)
        },
        onError: error => {
          console.error(`❌ Error watching pool ${poolAddress}:`, error)
          this.handleReconnection(poolAddress)
        },
        pollingInterval: 1000, // Poll every second for HTTP
      }

      // Only add poll property for HTTP transport
      if (this.client.transport.type === 'http') {
        watchConfig.poll = true
      }

      const unwatch = this.client.watchContractEvent(watchConfig)

      this.unwatchFunctions.push(unwatch)
    } catch (error) {
      console.error(`❌ Failed to start watching pool ${poolAddress}:`, error)
      this.handleReconnection(poolAddress)
    }
  }

  /**
   * Process swap logs and convert them to SwapEvent objects
   */
  private async processSwapLogs(logs: Log[], poolAddress: Address): Promise<void> {
    for (const log of logs) {
      try {
        // Parse the log using viem's parseEventLogs
        const parsedLogs = parseEventLogs({
          abi: v3PoolAbi,
          eventName: 'Swap',
          logs: [log],
        })

        if (parsedLogs.length === 0) continue

        const parsedLog = parsedLogs[0] as any

        // Type guard to ensure args exist
        if (!parsedLog.args) {
          console.warn('Parsed log missing args:', parsedLog)
          continue
        }

        const args = parsedLog.args

        // Get block for timestamp
        const block = await this.client.getBlock({
          blockNumber: log.blockNumber!,
        })

        // Create SwapEvent object
        const swapEvent: SwapEvent = {
          type: DexEventType.Swap,
          pool: poolAddress,
          sender: args.sender as string,
          recipient: args.recipient as string,
          amount0: args.amount0 as bigint,
          amount1: args.amount1 as bigint,
          sqrtPriceX96: args.sqrtPriceX96 as bigint,
          liquidity: args.liquidity as bigint,
          tick: Number(args.tick),
          blockNumber: Number(log.blockNumber!),
          transactionHash: log.transactionHash!,
          transactionIndex: Number(log.transactionIndex!),
          logIndex: Number(log.logIndex!),
          address: poolAddress,
          timestamp: Number(block.timestamp),
        }

        // Notify all listeners
        for (const callback of Array.from(this.listeners.values())) {
          try {
            callback(swapEvent)
          } catch (error) {
            console.error('❌ Error in swap event listener:', error)
          }
        }

        // Reset reconnect attempts on successful event processing
        this.reconnectAttempts = 0
      } catch (error) {
        console.error('❌ Error processing swap log:', error)
      }
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(poolAddress: Address): void {
    if (!this.isRunning) return

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      console.log(
        `🔄 Attempting to reconnect pool ${poolAddress} (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
      )

      setTimeout(() => {
        if (this.isRunning) {
          this.watchPoolEvents(poolAddress)
        }
      }, delay)
    } else {
      console.error(`❌ Max reconnection attempts reached for pool ${poolAddress}`)
    }
  }

  /**
   * Stop streaming events
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('🛑 Stopping DEX swap stream')

    // Stop all watchers
    for (const unwatch of this.unwatchFunctions) {
      try {
        unwatch()
      } catch (error) {
        console.error('❌ Error stopping watcher:', error)
      }
    }
    this.unwatchFunctions = []

    // Clear all listeners
    this.removeAllListeners()

    this.isRunning = false
    this.reconnectAttempts = 0
  }

  /**
   * Get pool addresses being monitored
   */
  getPoolAddresses(): Address[] {
    return [...this.poolAddresses]
  }

  /**
   * Add pool addresses to monitor
   */
  addPoolAddresses(addresses: Address[]): void {
    const newPools = addresses.filter(addr => !this.poolAddresses.includes(addr))
    this.poolAddresses.push(...newPools)

    // If already running, start watching the new pools
    if (this.isRunning) {
      for (const poolAddress of newPools) {
        this.watchPoolEvents(poolAddress)
      }
    }
  }

  /**
   * Remove pool addresses from monitoring
   */
  removePoolAddresses(addresses: Address[]): void {
    this.poolAddresses = this.poolAddresses.filter(addr => !addresses.includes(addr))

    // Note: This doesn't stop existing watchers for removed pools
    // You might want to implement more sophisticated watcher management
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
    poolAddresses: string[]
    transport: string
    poolCount: number
  } {
    return {
      poolAddresses: [...this.poolAddresses],
      transport: this.client.transport.type || 'unknown',
      poolCount: this.poolAddresses.length,
    }
  }
}
