import type { Address, PublicClient } from 'viem'
import { createPublicClient, webSocket, http } from 'viem'
import { CONTRACTS, CHAINS, DEFAULT_NETWORK, NADS_FEE_TIER, type Network } from './constants'
import { v3PoolAbi } from './abis/v3pool'
import { v3factoryAbi } from './abis/v3factory'

// ==================== Types ====================

export interface DexStreamConfig {
  wsUrl: string
  pools: Address[]
  network?: Network
}

export interface SwapEvent {
  pool: Address
  sender: Address
  recipient: Address
  amount0: bigint
  amount1: bigint
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
  blockNumber: bigint
  transactionHash: `0x${string}`
  logIndex: number
}

export interface DexStream {
  readonly publicClient: PublicClient
  readonly pools: Address[]

  start: () => void
  stop: () => void

  onSwap: (callback: (event: SwapEvent) => void) => () => void
  onError: (callback: (error: Error) => void) => () => void
}

export interface PoolDiscoveryConfig {
  rpcUrl: string
}

// ==================== Pool Discovery ====================

export async function discoverPoolForToken(
  rpcUrl: string,
  token: Address,
  network: Network = DEFAULT_NETWORK
): Promise<Address | null> {
  const chain = CHAINS[network]
  const contracts = CONTRACTS[network]

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  const pool = await publicClient.readContract({
    address: contracts.V3_FACTORY,
    abi: v3factoryAbi,
    functionName: 'getPool',
    args: [token, contracts.WMON, NADS_FEE_TIER],
  })

  // Check if pool exists (not zero address)
  if (pool === '0x0000000000000000000000000000000000000000') {
    return null
  }

  return pool
}

export async function discoverPoolsForTokens(
  rpcUrl: string,
  tokens: Address[],
  network: Network = DEFAULT_NETWORK
): Promise<Address[]> {
  const pools: Address[] = []

  for (const token of tokens) {
    const pool = await discoverPoolForToken(rpcUrl, token, network)
    if (pool) {
      pools.push(pool)
    }
  }

  return pools
}

// ==================== Factory ====================

export function createDexStream(config: DexStreamConfig): DexStream {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]

  const publicClient = createPublicClient({
    chain,
    transport: webSocket(config.wsUrl),
  })

  let unwatchFns: (() => void)[] = []
  const swapCallbacks: Set<(event: SwapEvent) => void> = new Set()
  const errorCallbacks: Set<(error: Error) => void> = new Set()

  function handleError(error: Error) {
    errorCallbacks.forEach((cb) => cb(error))
  }

  return {
    publicClient,
    pools: config.pools,

    start() {
      if (unwatchFns.length > 0) return

      for (const pool of config.pools) {
        const unwatch = publicClient.watchContractEvent({
          address: pool,
          abi: v3PoolAbi,
          eventName: 'Swap',
          onLogs: (logs) => {
            for (const log of logs) {
              const event: SwapEvent = {
                pool,
                sender: log.args.sender!,
                recipient: log.args.recipient!,
                amount0: log.args.amount0!,
                amount1: log.args.amount1!,
                sqrtPriceX96: log.args.sqrtPriceX96!,
                liquidity: log.args.liquidity!,
                tick: log.args.tick!,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex,
              }

              swapCallbacks.forEach((cb) => {
                try {
                  cb(event)
                } catch (err) {
                  handleError(err instanceof Error ? err : new Error(String(err)))
                }
              })
            }
          },
          onError: handleError,
        })

        unwatchFns.push(unwatch)
      }
    },

    stop() {
      unwatchFns.forEach((unwatch) => unwatch())
      unwatchFns = []
    },

    onSwap(callback) {
      swapCallbacks.add(callback)
      return () => swapCallbacks.delete(callback)
    },

    onError(callback) {
      errorCallbacks.add(callback)
      return () => errorCallbacks.delete(callback)
    },
  }
}

// ==================== Convenience Factory ====================

export async function createDexStreamWithTokens(
  wsUrl: string,
  rpcUrl: string,
  tokens: Address[],
  network: Network = DEFAULT_NETWORK
): Promise<DexStream> {
  const pools = await discoverPoolsForTokens(rpcUrl, tokens, network)

  if (pools.length === 0) {
    throw new Error('No pools found for provided tokens')
  }

  return createDexStream({ wsUrl, pools, network })
}
