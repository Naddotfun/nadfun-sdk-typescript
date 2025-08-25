/**
 * Types Module - Centralized type definitions
 *
 * This file serves as the main entry point for all type definitions,
 * All types are organized by domain
 * and re-exported from here for easy importing.
 */

// Trade-related types
export type {
  BuyParams,
  SellParams,
  SellPermitParams,
  QuoteResult,
  GasEstimationParams,
  RouterConfig,
} from './trade'
export { RouterType } from './trade'

// Token-related types
export type { TokenMetadata, TokenHealth, PermitSignature } from './token'

// Bonding curve types
export type {
  CurveState,
  AvailableBuyTokens,
  CreateEvent,
  BuyEvent,
  SellEvent,
  SyncEvent,
  LockEvent,
  ListedEvent,
  BondingCurveEvent,
} from './curve'

// Export curve enums
export { CurveEventType } from './curve'

// DEX-related types
export type { BaseDexEvent, SwapEvent, PoolMetadata, PoolDiscoveryResult, DexEvent } from './dex'

// Export DEX enums
export { DexEventType } from './dex'

// Stream common types
export type { BaseEvent, EventFilter, EventHandler, ErrorHandler } from './stream'

/**
 * Re-export everything for convenience
 * This allows importing with: import * as Types from '@nadfun/sdk/types'
 */
export * from './trade'
export * from './token'
export * from './curve'
export * from './dex'
export * from './stream'
