import { parseAbiItem, parseAbi, parseEventLogs, toEventSelector, Log, AbiEvent } from 'viem'
import { CurveEventType, BondingCurveEvent } from './types'

// Bonding Curve Event ABIs
export const CURVE_EVENT_ABIS = parseAbi([
  'event CurveCreate(address indexed creator, address indexed token, address indexed pool, string name, string symbol, string tokenURI, uint256 virtualMon, uint256 virtualToken, uint256 targetTokenAmount)',
  'event CurveBuy(address indexed sender, address indexed token, uint256 amountIn, uint256 amountOut)',
  'event CurveSell(address indexed sender, address indexed token, uint256 amountIn, uint256 amountOut)',
  'event CurveSync(address indexed token, uint256 realMonReserve, uint256 realTokenReserve, uint256 virtualMonReserve, uint256 virtualTokenReserve)',
  'event CurveTokenLocked(address indexed token)',
  'event CurveTokenListed(address indexed token, address indexed pool)',
])

/**
 * Parse a bonding curve event from a log
 */
export function parseBondingCurveEvent(log: Log, timestamp?: number): BondingCurveEvent | null {
  try {
    const parsedLogs = parseEventLogs({
      abi: CURVE_EVENT_ABIS,
      logs: [log],
    })

    if (parsedLogs.length === 0) return null

    const parsed = parsedLogs[0]
    const baseEvent = {
      blockNumber: Number(log.blockNumber!),
      transactionHash: log.transactionHash!,
      transactionIndex: log.transactionIndex!,
      logIndex: log.logIndex!,
      address: log.address,
      token: parsed.args.token,
      timestamp,
    }

    switch (parsed.eventName) {
      case 'CurveCreate':
        return {
          ...baseEvent,
          type: 'Create',
          creator: parsed.args.creator,
          pool: parsed.args.pool,
          name: parsed.args.name,
          symbol: parsed.args.symbol,
          tokenURI: parsed.args.tokenURI,
          virtualMon: BigInt(parsed.args.virtualMon),
          virtualToken: BigInt(parsed.args.virtualToken),
          targetTokenAmount: BigInt(parsed.args.targetTokenAmount),
        }

      case 'CurveBuy':
        return {
          ...baseEvent,
          type: 'Buy',
          sender: parsed.args.sender,
          amountIn: BigInt(parsed.args.amountIn),
          amountOut: BigInt(parsed.args.amountOut),
        }

      case 'CurveSell':
        return {
          ...baseEvent,
          type: 'Sell',
          sender: parsed.args.sender,
          amountIn: BigInt(parsed.args.amountIn),
          amountOut: BigInt(parsed.args.amountOut),
        }

      case 'CurveSync':
        return {
          ...baseEvent,
          type: 'Sync',
          realMonReserve: BigInt(parsed.args.realMonReserve),
          realTokenReserve: BigInt(parsed.args.realTokenReserve),
          virtualMonReserve: BigInt(parsed.args.virtualMonReserve),
          virtualTokenReserve: BigInt(parsed.args.virtualTokenReserve),
        }

      case 'CurveTokenLocked':
        return {
          ...baseEvent,
          type: 'Lock',
        }

      case 'CurveTokenListed':
        return {
          ...baseEvent,
          type: 'Listed',
          pool: parsed.args.pool,
        }

      default:
        return null
    }
  } catch (error) {
    console.error('Failed to parse bonding curve event:', error)
    return null
  }
}

/**
 * Get event signatures for specified curve event types
 */
export function getCurveEventSignatures(eventTypes: CurveEventType[]): string[] {
  const eventMap: Record<string, string> = {
    Create:
      'event CurveCreate(address indexed creator, address indexed token, address indexed pool, string name, string symbol, string tokenURI, uint256 virtualMon, uint256 virtualToken, uint256 targetTokenAmount)',
    Buy: 'event CurveBuy(address indexed sender, address indexed token, uint256 amountIn, uint256 amountOut)',
    Sell: 'event CurveSell(address indexed sender, address indexed token, uint256 amountIn, uint256 amountOut)',
    Sync: 'event CurveSync(address indexed token, uint256 realMonReserve, uint256 realTokenReserve, uint256 virtualMonReserve, uint256 virtualTokenReserve)',
    Lock: 'event CurveTokenLocked(address indexed token)',
    Listed: 'event CurveTokenListed(address indexed token, address indexed pool)',
  }

  return eventTypes
    .map(type => {
      const eventSignature = eventMap[type.toString()]
      return eventSignature ? toEventSelector(parseAbiItem(eventSignature) as AbiEvent) : null
    })
    .filter(Boolean) as string[]
}

/**
 * Sort events chronologically
 */
export function sortEventsChronologically<
  T extends { blockNumber: number; transactionIndex: number; logIndex: number },
>(events: T[]): T[] {
  return events.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber
    }
    if (a.transactionIndex !== b.transactionIndex) {
      return a.transactionIndex - b.transactionIndex
    }
    return a.logIndex - b.logIndex
  })
}
