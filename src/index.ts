// ==================== SDK ====================
export { initSDK } from './sdk'
export type { SDKConfig, NadFunSDK, SimpleBuyParams, SimpleSellParams } from './sdk'

// ==================== Core ====================
export { createCore } from './core'
export type {
  CoreConfig,
  Core,
  QuoteResult,
  CurveState,
  AvailableBuyTokens,
  BuyParams,
  SellParams,
  SellPermitParams,
  GasEstimationParams,
} from './core'

// ==================== Token Helper ====================
export { createTokenHelper } from './tokenHelper'
export type {
  TokenHelperConfig,
  TokenHelper,
  TokenMetadata,
  PermitSignature,
} from './tokenHelper'

// ==================== Curve Stream ====================
export { createCurveStream } from './curveStream'
export type {
  CurveStreamConfig,
  CurveStream,
  CurveEventType,
  CurveEvent,
  CreateEvent,
  BuyEvent,
  SellEvent,
  SyncEvent,
  TokenLockedEvent,
  GraduateEvent,
} from './curveStream'

// ==================== Curve Indexer ====================
export { createCurveIndexer } from './curveIndexer'
export type {
  CurveIndexerConfig,
  CurveIndexer,
  EventFilter,
} from './curveIndexer'

// ==================== DEX Stream ====================
export {
  createDexStream,
  createDexStreamWithTokens,
  discoverPoolForToken,
  discoverPoolsForTokens,
} from './dexStream'
export type {
  DexStreamConfig,
  DexStream,
  SwapEvent,
  PoolDiscoveryConfig,
} from './dexStream'

// ==================== DEX Indexer ====================
export { createDexIndexer, createDexIndexerWithTokens } from './dexIndexer'
export type { DexIndexerConfig, DexIndexer, SwapFilter, PoolInfo } from './dexIndexer'

// ==================== Constants ====================
export {
  CONTRACTS,
  CHAINS,
  DEFAULT_NETWORK,
  DEFAULT_DEADLINE_SECONDS,
  NADS_FEE_TIER,
  // Legacy exports
  CURRENT_CHAIN,
  CHAIN_ID,
} from './constants'
export type { Network, NetworkContracts } from './constants'

// ==================== Utilities ====================

/**
 * Calculate minimum amount out with slippage tolerance
 * @param amountOut - Expected output amount
 * @param slippagePercent - Slippage tolerance in percent (e.g., 0.5 for 0.5%)
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100))
  return (amountOut * (10000n - slippageBps)) / 10000n
}

/**
 * Calculate maximum amount in with slippage tolerance
 * @param amountIn - Expected input amount
 * @param slippagePercent - Slippage tolerance in percent (e.g., 0.5 for 0.5%)
 */
export function calculateMaxAmountIn(amountIn: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100))
  return (amountIn * (10000n + slippageBps)) / 10000n
}

// Re-export viem utilities for convenience
export { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
