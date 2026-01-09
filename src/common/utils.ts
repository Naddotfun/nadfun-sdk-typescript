// ==================== Slippage Calculation ====================

/**
 * Calculate minimum amount out with slippage tolerance
 * @param amountOut - Expected output amount
 * @param slippagePercent - Slippage tolerance in percent (e.g., 0.5 for 0.5%)
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100))
  return (amountOut * (10000n - slippageBps)) / 10000n
}
