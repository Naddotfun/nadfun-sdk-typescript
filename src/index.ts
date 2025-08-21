// Main exports
export { Trade } from './trading/trade'
export { Token } from './token/token'

// Types
export type {
  // Trade types
  BuyParams,
  SellParams,
  SellPermitParams,
  QuoteResult,
  GasEstimationParams,
  RouterConfig,
  // Token types
  TokenMetadata,
  TokenHealth,
  PermitSignature,
  // Curve types
  CurveState,
  AvailableBuyTokens,
  BondingCurveEvent,
  CreateEvent,
  BuyEvent,
  SellEvent,
  SyncEvent,
  LockEvent,
  ListedEvent,
  // DEX types
  SwapEvent,
  PoolMetadata,
  DexEvent,
  // Stream types
  BaseEvent,
  StreamConfig,
  EventFilter,
} from './types'

// Export enums
export { CurveEventType, DexEventType, StreamStatus, RouterType } from './types'

// Utils
export {
  calculateSlippage,
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
} from './trading/slippage'

// Gas estimation utils
export { estimateGas, estimateBuyGas, estimateSellGas, estimateSellPermitGas } from './trading/gas'

// Constants
export { CONTRACTS, CHAIN_ID, DEFAULT_DEADLINE_SECONDS } from './constants'

// Stream modules
export * from './stream'
