import type { Address, PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import { CONTRACTS, CHAINS, DEFAULT_NETWORK, type Network } from '../common/constants'
import { curveAbi } from '../abis/curve'
import type {
  CurveEvent,
  CurveEventType,
  CreateEvent,
  BuyEvent,
  SellEvent,
  SyncEvent,
  TokenLockedEvent,
  GraduateEvent,
} from '../stream/curve'

// ==================== Types ====================

export interface CurveIndexerConfig {
  rpcUrl: string
  network?: Network
}

export interface EventFilter {
  fromBlock: bigint
  toBlock: bigint
  eventTypes?: CurveEventType[]
  tokens?: Address[]
}

export interface CurveIndexer {
  readonly publicClient: PublicClient

  getEvents: (filter: EventFilter) => Promise<CurveEvent[]>
  getCreateEvents: (fromBlock: bigint, toBlock: bigint, creator?: Address) => Promise<CreateEvent[]>
  getBuyEvents: (fromBlock: bigint, toBlock: bigint, token?: Address) => Promise<BuyEvent[]>
  getSellEvents: (fromBlock: bigint, toBlock: bigint, token?: Address) => Promise<SellEvent[]>
  getSyncEvents: (fromBlock: bigint, toBlock: bigint, token?: Address) => Promise<SyncEvent[]>
  getTokenLockedEvents: (fromBlock: bigint, toBlock: bigint, token?: Address) => Promise<TokenLockedEvent[]>
  getGraduateEvents: (fromBlock: bigint, toBlock: bigint, token?: Address) => Promise<GraduateEvent[]>

  getLatestBlock: () => Promise<bigint>
}

// Re-export types from curveStream for convenience
export type {
  CurveEvent,
  CurveEventType,
  CreateEvent,
  BuyEvent,
  SellEvent,
  SyncEvent,
  TokenLockedEvent,
  GraduateEvent,
}

// ==================== Factory ====================

export function createCurveIndexer(config: CurveIndexerConfig): CurveIndexer {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]
  const contracts = CONTRACTS[network]

  const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  })

  async function fetchLogs(
    fromBlock: bigint,
    toBlock: bigint,
    eventName?: string,
    args?: Record<string, unknown>
  ) {
    const logs = await publicClient.getContractEvents({
      address: contracts.CURVE,
      abi: curveAbi,
      eventName: eventName as any,
      fromBlock,
      toBlock,
      args: args as any,
    })
    return logs
  }

  function parseEvents(logs: Awaited<ReturnType<typeof fetchLogs>>): CurveEvent[] {
    const events: CurveEvent[] = []

    for (const log of logs) {
      const baseEvent = {
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      }
      const args = log.args as Record<string, unknown>

      switch (log.eventName) {
        case 'CurveCreate':
          events.push({
            ...baseEvent,
            type: 'Create',
            creator: args.creator as Address,
            token: args.token as Address,
            pool: args.pool as Address,
            name: args.name as string,
            symbol: args.symbol as string,
            tokenURI: args.tokenURI as string,
            virtualMon: args.virtualMon as bigint,
            virtualToken: args.virtualToken as bigint,
            targetTokenAmount: args.targetTokenAmount as bigint,
          })
          break

        case 'CurveBuy':
          events.push({
            ...baseEvent,
            type: 'Buy',
            sender: args.sender as Address,
            token: args.token as Address,
            amountIn: args.amountIn as bigint,
            amountOut: args.amountOut as bigint,
          })
          break

        case 'CurveSell':
          events.push({
            ...baseEvent,
            type: 'Sell',
            sender: args.sender as Address,
            token: args.token as Address,
            amountIn: args.amountIn as bigint,
            amountOut: args.amountOut as bigint,
          })
          break

        case 'CurveSync':
          events.push({
            ...baseEvent,
            type: 'Sync',
            token: args.token as Address,
            realMonReserve: args.realMonReserve as bigint,
            realTokenReserve: args.realTokenReserve as bigint,
            virtualMonReserve: args.virtualMonReserve as bigint,
            virtualTokenReserve: args.virtualTokenReserve as bigint,
          })
          break

        case 'CurveTokenLocked':
          events.push({
            ...baseEvent,
            type: 'TokenLocked',
            token: args.token as Address,
          })
          break

        case 'CurveGraduate':
          events.push({
            ...baseEvent,
            type: 'Graduate',
            token: args.token as Address,
            pool: args.pool as Address,
          })
          break
      }
    }

    return events
  }

  function filterByEventTypes(events: CurveEvent[], types: CurveEventType[]): CurveEvent[] {
    return events.filter((e) => types.includes(e.type))
  }

  function filterByTokens(events: CurveEvent[], tokens: Address[]): CurveEvent[] {
    const lowerTokens = tokens.map((t) => t.toLowerCase())
    return events.filter((e) => {
      if ('token' in e) {
        return lowerTokens.includes(e.token.toLowerCase())
      }
      return true
    })
  }

  return {
    publicClient,

    async getEvents(filter) {
      const logs = await fetchLogs(filter.fromBlock, filter.toBlock)
      let events = parseEvents(logs)

      if (filter.eventTypes && filter.eventTypes.length > 0) {
        events = filterByEventTypes(events, filter.eventTypes)
      }

      if (filter.tokens && filter.tokens.length > 0) {
        events = filterByTokens(events, filter.tokens)
      }

      return events
    },

    async getCreateEvents(fromBlock, toBlock, creator) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveCreate', creator ? { creator } : undefined)
      return parseEvents(logs) as CreateEvent[]
    },

    async getBuyEvents(fromBlock, toBlock, token) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveBuy', token ? { token } : undefined)
      return parseEvents(logs) as BuyEvent[]
    },

    async getSellEvents(fromBlock, toBlock, token) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveSell', token ? { token } : undefined)
      return parseEvents(logs) as SellEvent[]
    },

    async getSyncEvents(fromBlock, toBlock, token) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveSync', token ? { token } : undefined)
      return parseEvents(logs) as SyncEvent[]
    },

    async getTokenLockedEvents(fromBlock, toBlock, token) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveTokenLocked', token ? { token } : undefined)
      return parseEvents(logs) as TokenLockedEvent[]
    },

    async getGraduateEvents(fromBlock, toBlock, token) {
      const logs = await fetchLogs(fromBlock, toBlock, 'CurveGraduate', token ? { token } : undefined)
      return parseEvents(logs) as GraduateEvent[]
    },

    async getLatestBlock() {
      return publicClient.getBlockNumber()
    },
  }
}
