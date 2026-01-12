// ==================== SDK ====================
export { initSDK } from './core'
export type { SDKConfig, NadFunSDK, SimpleBuyParams, SimpleSellParams } from './core'

// ==================== Trading ====================
export { createTrading } from './trading/trading'
export type {
  TradingConfig,
  Trading,
  QuoteResult,
  CurveState,
  AvailableBuyTokens,
  TradeParams,
  BuyParams,
  SellParams,
  SellPermitParams,
  GasEstimationParams,
} from './trading/trading'

// ==================== Token Helper ====================
export { createTokenHelper } from './token/tokenHelper'
export type {
  TokenHelperConfig,
  TokenHelper,
  TokenMetadata,
  PermitSignature,
  // Token Create
  UploadImageResult,
  UploadMetadataParams,
  UploadMetadataResult,
  MineSaltParams,
  MineSaltResult,
  CreateTokenParams,
  CreateTokenResult,
  FeeConfig,
} from './token/tokenHelper'

// ==================== Curve Stream ====================
export { createCurveStream } from './stream/curve'
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
} from './stream/curve'

// ==================== Curve Indexer ====================
export { createCurveIndexer } from './indexer/curve'
export type {
  CurveIndexerConfig,
  CurveIndexer,
  EventFilter,
} from './indexer/curve'

// ==================== DEX Stream ====================
export {
  createDexStream,
  createDexStreamWithTokens,
  discoverPoolForToken,
  discoverPoolsForTokens,
} from './stream/dex'
export type {
  DexStreamConfig,
  DexStream,
  SwapEvent,
  PoolDiscoveryConfig,
} from './stream/dex'

// ==================== DEX Indexer ====================
export { createDexIndexer, createDexIndexerWithTokens } from './indexer/dex'
export type { DexIndexerConfig, DexIndexer, SwapFilter, PoolInfo } from './indexer/dex'

// ==================== Constants ====================
export {
  CONTRACTS,
  CHAINS,
  DEFAULT_NETWORK,
  DEFAULT_DEADLINE_SECONDS,
  NADS_FEE_TIER,
} from './common/constants'
export type { Network, NetworkContracts } from './common/constants'

// ==================== Utilities ====================
export { calculateMinAmountOut } from './common/utils'

// Re-export viem utilities for convenience
export { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
