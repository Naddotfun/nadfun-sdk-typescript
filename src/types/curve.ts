import { Address } from 'viem'

/**
 * Bonding Curve Types
 * Used by: src/Trade.ts, src/stream/curve/*.ts, examples/stream/curve*.ts
 */

/**
 * Bonding curve data structure
 * Used by: Trade.getCurveState()
 */
export interface CurveState {
  realMonReserve: bigint
  realTokenReserve: bigint
  virtualMonReserve: bigint
  virtualTokenReserve: bigint
  k: bigint
  targetTokenAmount: bigint
  initVirtualMonReserve: bigint
  initVirtualTokenReserve: bigint
}

//availableBuyTokens
export interface AvailableBuyTokens {
  availableBuyToken: bigint
  requiredMonAmount: bigint
}

/**
 * Bonding curve event types enumeration
 * Used by: src/stream/curve/parser.ts, src/stream/curve/stream.ts
 */
export enum CurveEventType {
  Create = 'CurveCreate',
  Buy = 'CurveBuy',
  Sell = 'CurveSell',
  Sync = 'CurveSync',
  Lock = 'CurveTokenLocked',
  Listed = 'CurveTokenListed',
}

/**
 * Token creation event on bonding curve
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface CreateEvent {
  type: CurveEventType.Create
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Created token address */
  token: Address
  /** Address that created the token */
  creator: Address
  /** Bonding curve pool address */
  pool: Address
  /** Token name */
  name: string
  /** Token symbol */
  symbol: string
  /** Token metadata URI */
  tokenURI: string
  /** Initial virtual MON reserves */
  virtualMon: bigint
  /** Initial virtual token reserves */
  virtualToken: bigint
  /** Target token amount for curve graduation */
  targetTokenAmount: bigint
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Token buy event on bonding curve
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface BuyEvent {
  type: CurveEventType.Buy
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Token being purchased */
  token: Address
  /** Address making the purchase */
  sender: Address
  /** Amount of MON spent */
  amountIn: bigint
  /** Amount of tokens received */
  amountOut: bigint
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Token sell event on bonding curve
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface SellEvent {
  type: CurveEventType.Sell
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Token being sold */
  token: Address
  /** Address making the sale */
  sender: Address
  /** Amount of tokens sold */
  amountIn: bigint
  /** Amount of MON received */
  amountOut: bigint
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Curve synchronization event (reserves update)
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface SyncEvent {
  type: CurveEventType.Sync
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Token address */
  token: Address
  /** Real MON reserves */
  realMonReserve: bigint
  /** Real token reserves */
  realTokenReserve: bigint
  /** Virtual MON reserves */
  virtualMonReserve: bigint
  /** Virtual token reserves */
  virtualTokenReserve: bigint
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Token lock event (trading disabled)
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface LockEvent {
  type: CurveEventType.Lock
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Locked token address */
  token: Address
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Token listing event (graduated to DEX)
 * Used by: src/stream/curve/parser.ts, examples/stream/curve*.ts
 */
export interface ListedEvent {
  type: CurveEventType.Listed
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  /** Listed token address */
  token: Address
  /** DEX pool address */
  pool: Address
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Union type of all bonding curve events
 * Used by: src/stream/curve/stream.ts, src/stream/curve/indexer.ts
 */
export type BondingCurveEvent =
  | CreateEvent
  | BuyEvent
  | SellEvent
  | SyncEvent
  | LockEvent
  | ListedEvent
