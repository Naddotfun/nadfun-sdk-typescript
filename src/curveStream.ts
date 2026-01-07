import type { Address, PublicClient, Log } from 'viem'
import { createPublicClient, webSocket, parseEventLogs } from 'viem'
import { CONTRACTS, CHAINS, DEFAULT_NETWORK, type Network } from './constants'
import { curveAbi } from './abis/curve'

// ==================== Types ====================

export interface CurveStreamConfig {
  wsUrl: string
  network?: Network
}

export type CurveEventType = 'Create' | 'Buy' | 'Sell' | 'Sync' | 'TokenLocked' | 'Graduate'

interface BaseCurveEvent {
  type: CurveEventType
  blockNumber: bigint
  transactionHash: `0x${string}`
  logIndex: number
}

export interface CreateEvent extends BaseCurveEvent {
  type: 'Create'
  creator: Address
  token: Address
  pool: Address
  name: string
  symbol: string
  tokenURI: string
  virtualMon: bigint
  virtualToken: bigint
  targetTokenAmount: bigint
}

export interface BuyEvent extends BaseCurveEvent {
  type: 'Buy'
  sender: Address
  token: Address
  amountIn: bigint
  amountOut: bigint
}

export interface SellEvent extends BaseCurveEvent {
  type: 'Sell'
  sender: Address
  token: Address
  amountIn: bigint
  amountOut: bigint
}

export interface SyncEvent extends BaseCurveEvent {
  type: 'Sync'
  token: Address
  realMonReserve: bigint
  realTokenReserve: bigint
  virtualMonReserve: bigint
  virtualTokenReserve: bigint
}

export interface TokenLockedEvent extends BaseCurveEvent {
  type: 'TokenLocked'
  token: Address
}

export interface GraduateEvent extends BaseCurveEvent {
  type: 'Graduate'
  token: Address
  pool: Address
}

export type CurveEvent =
  | CreateEvent
  | BuyEvent
  | SellEvent
  | SyncEvent
  | TokenLockedEvent
  | GraduateEvent

export interface CurveStream {
  readonly publicClient: PublicClient

  start: () => void
  stop: () => void

  onEvent: (callback: (event: CurveEvent) => void) => () => void
  onError: (callback: (error: Error) => void) => () => void

  filterTokens: (tokens: Address[]) => void
  filterEventTypes: (types: CurveEventType[]) => void
  clearFilters: () => void
}

// ==================== Factory ====================

export function createCurveStream(config: CurveStreamConfig): CurveStream {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]
  const contracts = CONTRACTS[network]

  const publicClient = createPublicClient({
    chain,
    transport: webSocket(config.wsUrl),
  })

  let unwatch: (() => void) | null = null
  const eventCallbacks: Set<(event: CurveEvent) => void> = new Set()
  const errorCallbacks: Set<(error: Error) => void> = new Set()

  let tokenFilter: Address[] | null = null
  let eventTypeFilter: CurveEventType[] | null = null

  function parseLog(log: Log): CurveEvent | null {
    try {
      const parsed = parseEventLogs({
        abi: curveAbi,
        logs: [log],
      })

      if (parsed.length === 0) return null

      const event = parsed[0]
      const baseEvent = {
        blockNumber: log.blockNumber!,
        transactionHash: log.transactionHash!,
        logIndex: log.logIndex!,
      }

      switch (event.eventName) {
        case 'CurveCreate':
          return {
            ...baseEvent,
            type: 'Create',
            creator: event.args.creator,
            token: event.args.token,
            pool: event.args.pool,
            name: event.args.name,
            symbol: event.args.symbol,
            tokenURI: event.args.tokenURI,
            virtualMon: event.args.virtualMon,
            virtualToken: event.args.virtualToken,
            targetTokenAmount: event.args.targetTokenAmount,
          }

        case 'CurveBuy':
          return {
            ...baseEvent,
            type: 'Buy',
            sender: event.args.sender,
            token: event.args.token,
            amountIn: event.args.amountIn,
            amountOut: event.args.amountOut,
          }

        case 'CurveSell':
          return {
            ...baseEvent,
            type: 'Sell',
            sender: event.args.sender,
            token: event.args.token,
            amountIn: event.args.amountIn,
            amountOut: event.args.amountOut,
          }

        case 'CurveSync':
          return {
            ...baseEvent,
            type: 'Sync',
            token: event.args.token,
            realMonReserve: event.args.realMonReserve,
            realTokenReserve: event.args.realTokenReserve,
            virtualMonReserve: event.args.virtualMonReserve,
            virtualTokenReserve: event.args.virtualTokenReserve,
          }

        case 'CurveTokenLocked':
          return {
            ...baseEvent,
            type: 'TokenLocked',
            token: event.args.token,
          }

        case 'CurveGraduate':
          return {
            ...baseEvent,
            type: 'Graduate',
            token: event.args.token,
            pool: event.args.pool,
          }

        default:
          return null
      }
    } catch {
      return null
    }
  }

  function shouldEmitEvent(event: CurveEvent): boolean {
    // Check event type filter
    if (eventTypeFilter && !eventTypeFilter.includes(event.type)) {
      return false
    }

    // Check token filter
    if (tokenFilter) {
      const eventToken = 'token' in event ? event.token : null
      if (eventToken && !tokenFilter.some((t) => t.toLowerCase() === eventToken.toLowerCase())) {
        return false
      }
    }

    return true
  }

  function handleLog(log: Log) {
    const event = parseLog(log)
    if (event && shouldEmitEvent(event)) {
      eventCallbacks.forEach((cb) => {
        try {
          cb(event)
        } catch (err) {
          errorCallbacks.forEach((ecb) => ecb(err instanceof Error ? err : new Error(String(err))))
        }
      })
    }
  }

  function handleError(error: Error) {
    errorCallbacks.forEach((cb) => cb(error))
  }

  return {
    publicClient,

    start() {
      if (unwatch) return

      unwatch = publicClient.watchContractEvent({
        address: contracts.CURVE,
        abi: curveAbi,
        onLogs: (logs) => logs.forEach(handleLog),
        onError: handleError,
      })
    },

    stop() {
      if (unwatch) {
        unwatch()
        unwatch = null
      }
    },

    onEvent(callback) {
      eventCallbacks.add(callback)
      return () => eventCallbacks.delete(callback)
    },

    onError(callback) {
      errorCallbacks.add(callback)
      return () => errorCallbacks.delete(callback)
    },

    filterTokens(tokens) {
      tokenFilter = tokens.length > 0 ? tokens : null
    },

    filterEventTypes(types) {
      eventTypeFilter = types.length > 0 ? types : null
    },

    clearFilters() {
      tokenFilter = null
      eventTypeFilter = null
    },
  }
}
