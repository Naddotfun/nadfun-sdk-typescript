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
 * Uses basis points (10000 = 100%) for precision with decimal slippage
 *
 * @param amountOut Expected output amount
 * @param slippagePercent Slippage tolerance (e.g., 5.0 for 5%, 0.5 for 0.5%)
 * @returns Minimum amount out considering slippage
 *
 * @example
 * const expectedOut = parseEther("100")
 * const minOut = calculateMinAmountOut(expectedOut, 5.0) // 5% slippage
 * // Result: 95 tokens minimum
 * const minOut2 = calculateMinAmountOut(expectedOut, 0.5) // 0.5% slippage
 * // Result: 99.5 tokens minimum
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  if (slippagePercent < 0 || slippagePercent >= 100) {
    throw new Error('Slippage percent must be between 0 and 100 (exclusive)')
  }

  // Convert to basis points to avoid floating point errors
  const slippageBp = Math.floor(slippagePercent * 100)
  const remainingBp = 10000 - slippageBp

  return (amountOut * BigInt(remainingBp)) / BigInt(10000)
}

/**
 * Calculate maximum amount in with slippage protection
 * Used for operations where you want to limit the input amount
 *
 * Uses basis points (10000 = 100%) for precision with decimal slippage
 *
 * @param amountIn Expected input amount
 * @param slippagePercent Slippage tolerance (e.g., 5.0 for 5%, 0.5 for 0.5%)
 * @returns Maximum amount in considering slippage
 *
 * @example
 * const expectedIn = parseEther("100")
 * const maxIn = calculateMaxAmountIn(expectedIn, 5.0) // 5% slippage
 * // Result: 105 tokens maximum
 * const maxIn2 = calculateMaxAmountIn(expectedIn, 0.5) // 0.5% slippage
 * // Result: 100.5 tokens maximum
 */
export function calculateMaxAmountIn(amountIn: bigint, slippagePercent: number): bigint {
  if (slippagePercent < 0 || slippagePercent >= 100) {
    throw new Error('Slippage percent must be between 0 and 100 (exclusive)')
  }

  // Convert to basis points to avoid floating point errors
  const slippageBp = Math.floor(slippagePercent * 100)
  const totalBp = 10000 + slippageBp

  return (amountIn * BigInt(totalBp)) / BigInt(10000)
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

// Re-export from viem for convenience
export { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
