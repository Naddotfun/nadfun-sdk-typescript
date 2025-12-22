import type { Address, PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import { CHAINS, DEFAULT_NETWORK, type Network } from './constants'
import { v3PoolAbi } from './abis/v3pool'
import { type SwapEvent, discoverPoolsForTokens } from './dexStream'

// ==================== Types ====================

export interface DexIndexerConfig {
  rpcUrl: string
  pools: Address[]
  network?: Network
}

export interface SwapFilter {
  fromBlock: bigint
  toBlock: bigint
  sender?: Address
  recipient?: Address
}

export interface PoolInfo {
  address: Address
  token0: Address
  token1: Address
  fee: number
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
}

export interface DexIndexer {
  readonly publicClient: PublicClient
  readonly pools: Address[]

  getSwapEvents: (filter: SwapFilter) => Promise<SwapEvent[]>
  getSwapEventsForPool: (pool: Address, fromBlock: bigint, toBlock: bigint) => Promise<SwapEvent[]>

  getPoolInfo: (pool: Address) => Promise<PoolInfo>
  getPoolsInfo: () => Promise<PoolInfo[]>

  getLatestBlock: () => Promise<bigint>
}

// Re-export SwapEvent type
export type { SwapEvent }

// ==================== Factory ====================

export function createDexIndexer(config: DexIndexerConfig): DexIndexer {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]

  const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  })

  async function fetchSwapLogs(pool: Address, fromBlock: bigint, toBlock: bigint) {
    return publicClient.getContractEvents({
      address: pool,
      abi: v3PoolAbi,
      eventName: 'Swap',
      fromBlock,
      toBlock,
    })
  }

  function parseSwapLogs(
    pool: Address,
    logs: Awaited<ReturnType<typeof fetchSwapLogs>>
  ): SwapEvent[] {
    return logs.map((log) => ({
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
    }))
  }

  async function fetchPoolInfo(pool: Address): Promise<PoolInfo> {
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
      publicClient.readContract({ address: pool, abi: v3PoolAbi, functionName: 'token0' }),
      publicClient.readContract({ address: pool, abi: v3PoolAbi, functionName: 'token1' }),
      publicClient.readContract({ address: pool, abi: v3PoolAbi, functionName: 'fee' }),
      publicClient.readContract({ address: pool, abi: v3PoolAbi, functionName: 'liquidity' }),
      publicClient.readContract({ address: pool, abi: v3PoolAbi, functionName: 'slot0' }),
    ])
    return { address: pool, token0, token1, fee, liquidity, sqrtPriceX96: slot0[0], tick: slot0[1] }
  }

  return {
    publicClient,
    pools: config.pools,

    async getSwapEvents(filter) {
      const allEvents: SwapEvent[] = []

      for (const pool of config.pools) {
        const logs = await fetchSwapLogs(pool, filter.fromBlock, filter.toBlock)
        let events = parseSwapLogs(pool, logs)

        // Apply filters
        if (filter.sender) {
          const sender = filter.sender.toLowerCase()
          events = events.filter((e) => e.sender.toLowerCase() === sender)
        }

        if (filter.recipient) {
          const recipient = filter.recipient.toLowerCase()
          events = events.filter((e) => e.recipient.toLowerCase() === recipient)
        }

        allEvents.push(...events)
      }

      // Sort by block number and log index
      return allEvents.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return Number(a.blockNumber - b.blockNumber)
        }
        return a.logIndex - b.logIndex
      })
    },

    async getSwapEventsForPool(pool, fromBlock, toBlock) {
      const logs = await fetchSwapLogs(pool, fromBlock, toBlock)
      return parseSwapLogs(pool, logs)
    },

    getPoolInfo: fetchPoolInfo,

    async getPoolsInfo() {
      const infos: PoolInfo[] = []
      for (const pool of config.pools) {
        infos.push(await fetchPoolInfo(pool))
      }
      return infos
    },

    async getLatestBlock() {
      return publicClient.getBlockNumber()
    },
  }
}

// ==================== Convenience Factory ====================

export async function createDexIndexerWithTokens(
  rpcUrl: string,
  tokens: Address[],
  network: Network = DEFAULT_NETWORK
): Promise<DexIndexer> {
  const pools = await discoverPoolsForTokens(rpcUrl, tokens, network)

  if (pools.length === 0) {
    throw new Error('No pools found for provided tokens')
  }

  return createDexIndexer({ rpcUrl, pools, network })
}
