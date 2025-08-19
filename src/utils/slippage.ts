/**
 * viem already provides:
 * - parseEther(value: string): bigint
 * - formatEther(value: bigint): string
 * - parseUnits(value: string, decimals: number): bigint
 * - formatUnits(value: bigint, decimals: number): string
 *
 * So we only need custom slippage calculation
 */

export function calculateSlippage(amount: bigint, slippagePercent: number): bigint {
  if (slippagePercent < 0 || slippagePercent > 100) {
    throw new Error('Slippage percent must be between 0 and 100')
  }
  return (amount * BigInt(100 - slippagePercent)) / 100n
}

// Re-export from viem for convenience
export { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
