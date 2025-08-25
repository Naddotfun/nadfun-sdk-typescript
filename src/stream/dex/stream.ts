import { createPublicClient, parseEventLogs, webSocket, type Log } from 'viem'
import { DexEventType, SwapEvent } from '@/types'
import { v3PoolAbi } from '@/abis/v3pool'
import { v3factoryAbi } from '@/abis/v3factory'
import { CURRENT_CHAIN, CONTRACTS, NADS_FEE_TIER } from '@/constants'
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
  private watchFunctions: (() => void)[] = []
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  constructor(rpcUrl: string, poolAddresses: Address[]) {
    const client = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: webSocket(rpcUrl),
    })
    this.client = client
    this.poolAddresses = poolAddresses
  }

  /**
   * Create stream by discovering pools for token addresses
   * Uses V3 Factory to find token-WMON pools with NADS fee tier
   */
  static async discoverPoolsForTokens(rpcUrl: string, tokenAddresses: Address[]): Promise<Stream> {
    console.log(`🔍 Discovering pools for ${tokenAddresses.length} tokens...`)

    const poolAddresses: Address[] = await Stream.findPoolsForTokens(rpcUrl, tokenAddresses)
    console.log(`✅ Found ${poolAddresses.length} pools`)

    return new Stream(rpcUrl, poolAddresses)
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
      transport: webSocket(rpcUrl),
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

        console.log(poolAddress, 'poolAddress22222222222')

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
   * Add a callback for swap events
   * @returns Function to remove this listener
   */
  onSwap(callback: (event: SwapEvent) => void): () => void {
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
        },
      }

      // Only add poll property for HTTP transport
      if (this.client.transport.type === 'http') {
        watchConfig.poll = true
      }

      const watch = this.client.watchContractEvent(watchConfig)

      console.log(watch, 'watch')

      this.watchFunctions.push(watch)
    } catch (error) {
      console.error(`❌ Failed to start watching pool ${poolAddress}:`, error)
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
   * Stop streaming events
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('🛑 Stopping DEX swap stream')

    // Stop all watchers
    for (const unwatch of this.watchFunctions) {
      try {
        unwatch()
      } catch (error) {
        console.error('❌ Error stopping watcher:', error)
      }
    }
    this.watchFunctions = []

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
