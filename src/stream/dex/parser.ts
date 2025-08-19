import { parseAbi, parseEventLogs, Log } from 'viem'
import { DexEventType, SwapEvent } from '@/types'

// Uniswap V3 Swap Event ABI
export const SWAP_EVENT_ABI = parseAbi([
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
])

/**
 * Parse a swap event from a log
 */
export function parseSwapEvent(log: Log, timestamp?: number): SwapEvent | null {
  try {
    const parsedLogs = parseEventLogs({
      abi: SWAP_EVENT_ABI,
      logs: [log],
    })

    if (parsedLogs.length === 0) return null

    const parsed = parsedLogs[0]
    return {
      type: DexEventType.Swap,
      blockNumber: Number(log.blockNumber!),
      transactionHash: log.transactionHash!,
      transactionIndex: log.transactionIndex!,
      logIndex: log.logIndex!,
      address: log.address,
      pool: log.address,
      sender: parsed.args.sender,
      recipient: parsed.args.recipient,
      amount0: BigInt(parsed.args.amount0),
      amount1: BigInt(parsed.args.amount1),
      sqrtPriceX96: BigInt(parsed.args.sqrtPriceX96),
      liquidity: BigInt(parsed.args.liquidity),
      tick: Number(parsed.args.tick),
      timestamp,
    }
  } catch (error) {
    console.error('Failed to parse swap event:', error)
    return null
  }
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
