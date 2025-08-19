/**
 * Enhanced slippage utilities for trading operations
 *
 * viem already provides:
 * - parseEther(value: string): bigint
 * - formatEther(value: bigint): string
 * - parseUnits(value: string, decimals: number): bigint
 * - formatUnits(value: bigint, decimals: number): string
 */

/**
 * Calculate minimum amount out with slippage protection
 * Used for buy/sell operations where you want to set amountOutMin
 *
 * @param amountOut Expected output amount
 * @param slippagePercent Slippage tolerance (e.g., 5 for 5%)
 * @returns Minimum amount out considering slippage
 *
 * @example
 * const expectedOut = parseEther("100")
 * const minOut = calculateMinAmountOut(expectedOut, 5) // 5% slippage
 * // Result: 95 tokens minimum
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  if (slippagePercent < 0 || slippagePercent > 100) {
    throw new Error('Slippage percent must be between 0 and 100')
  }
  return (amountOut * BigInt(100 - slippagePercent)) / BigInt(100)
}

/**
 * Calculate maximum amount in with slippage protection
 * Used for operations where you want to limit the input amount
 *
 * @param amountIn Expected input amount
 * @param slippagePercent Slippage tolerance (e.g., 5 for 5%)
 * @returns Maximum amount in considering slippage
 *
 * @example
 * const expectedIn = parseEther("100")
 * const maxIn = calculateMaxAmountIn(expectedIn, 5) // 5% slippage
 * // Result: 105 tokens maximum
 */
export function calculateMaxAmountIn(amountIn: bigint, slippagePercent: number): bigint {
  if (slippagePercent < 0 || slippagePercent > 100) {
    throw new Error('Slippage percent must be between 0 and 100')
  }
  return (amountIn * BigInt(100 + slippagePercent)) / BigInt(100)
}

/**
 * Generic slippage calculation (backward compatibility)
 * Applies slippage reduction to any amount
 *
 * @deprecated Use calculateMinAmountOut or calculateMaxAmountIn for clarity
 */
export function calculateSlippage(amount: bigint, slippagePercent: number): bigint {
  return calculateMinAmountOut(amount, slippagePercent)
}

/**
 * Calculate actual slippage percentage from expected vs actual amounts
 * Useful for monitoring and analytics
 *
 * @param expectedAmount The amount that was expected
 * @param actualAmount The amount that was actually received/paid
 * @returns Slippage percentage (can be negative if better than expected)
 *
 * @example
 * const expected = parseEther("100")
 * const actual = parseEther("98")
 * const slippage = calculateActualSlippage(expected, actual)
 * // Result: 2.0 (2% slippage)
 */
export function calculateActualSlippage(expectedAmount: bigint, actualAmount: bigint): number {
  if (expectedAmount === BigInt(0)) {
    throw new Error('Expected amount cannot be zero')
  }

  const difference = expectedAmount - actualAmount
  const slippagePercent = (Number(difference) * 100) / Number(expectedAmount)

  return Math.round(slippagePercent * 100) / 100 // Round to 2 decimal places
}

/**
 * Check if actual slippage is within tolerance
 *
 * @param expectedAmount Expected amount
 * @param actualAmount Actual amount received
 * @param maxSlippagePercent Maximum acceptable slippage
 * @returns true if within tolerance, false otherwise
 */
export function isSlippageWithinTolerance(
  expectedAmount: bigint,
  actualAmount: bigint,
  maxSlippagePercent: number
): boolean {
  const actualSlippage = Math.abs(calculateActualSlippage(expectedAmount, actualAmount))
  return actualSlippage <= maxSlippagePercent
}

/**
 * Slippage presets for common use cases
 */
export const SLIPPAGE_PRESETS = {
  MINIMAL: 0.1, // 0.1% - For stablecoins and very liquid pairs
  LOW: 0.5, // 0.5% - For major tokens with good liquidity
  NORMAL: 1.0, // 1.0% - Standard slippage for most trades
  HIGH: 3.0, // 3.0% - For less liquid tokens
  VERY_HIGH: 5.0, // 5.0% - For very illiquid or volatile tokens
  EMERGENCY: 10.0, // 10.0% - Emergency trades, accept high slippage
} as const

/**
 * Get recommended slippage based on trade characteristics
 *
 * @param tradeSize Trade size in USD (approximate)
 * @param tokenType Type of token being traded
 * @returns Recommended slippage percentage
 */
export function getRecommendedSlippage(
  tradeSize: number,
  tokenType: 'stablecoin' | 'major' | 'minor' | 'micro'
): number {
  // Base slippage by token type
  let baseSlippage: number
  switch (tokenType) {
    case 'stablecoin':
      baseSlippage = SLIPPAGE_PRESETS.MINIMAL
      break
    case 'major':
      baseSlippage = SLIPPAGE_PRESETS.LOW
      break
    case 'minor':
      baseSlippage = SLIPPAGE_PRESETS.NORMAL
      break
    case 'micro':
      baseSlippage = SLIPPAGE_PRESETS.HIGH
      break
    default:
      baseSlippage = SLIPPAGE_PRESETS.NORMAL
  }

  // Adjust for trade size
  if (tradeSize > 100000) {
    baseSlippage *= 2 // Large trades need more slippage
  } else if (tradeSize > 10000) {
    baseSlippage *= 1.5
  }

  // Cap at emergency level
  return Math.min(baseSlippage, SLIPPAGE_PRESETS.EMERGENCY)
}

// Re-export from viem for convenience
export { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
