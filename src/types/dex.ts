import { Address } from 'viem'

/**
 * DEX (Decentralized Exchange) Types
 * Used by: src/stream/dex/*.ts, examples/stream/dex*.ts
 */

/**
 * DEX event types enumeration
 * Used by: src/stream/dex/parser.ts, src/stream/dex/stream.ts
 */
export enum DexEventType {
  Swap = 'Swap',
}

/**
 * Base interface for all DEX events
 * Used by: All DEX event interfaces
 */
export interface BaseDexEvent {
  /** Block number where event occurred */
  blockNumber: number
  /** Transaction hash containing the event */
  transactionHash: string
  /** Index of transaction in the block */
  transactionIndex: number
  /** Index of log in the transaction */
  logIndex: number
  /** Contract address that emitted the event */
  address: Address
  /** Block timestamp (optional) */
  timestamp?: number
}

/**
 * Uniswap V3 swap event
 * Used by: src/stream/dex/parser.ts, src/stream/dex/indexer.ts, examples/stream/dex*.ts
 */
export interface SwapEvent extends BaseDexEvent {
  type: 'Swap'
  /** Pool contract address */
  pool: string
  /** Address that initiated the swap */
  sender: string
  /** Address that received the output tokens */
  recipient: string
  /** Change in token0 balance (negative = out, positive = in) */
  amount0: bigint
  /** Change in token1 balance (negative = out, positive = in) */
  amount1: bigint
  /** Pool's sqrt(price) after the swap */
  sqrtPriceX96: bigint
  /** Pool's liquidity after the swap */
  liquidity: bigint
  /** Pool's current tick after the swap */
  tick: number
}

/**
 * Uniswap V3 pool metadata
 * Used by: src/stream/dex/indexer.ts, DexIndexer.discoverPoolsForTokens()
 */
export interface PoolMetadata {
  /** Pool contract address */
  poolAddress: Address
  /** First token in the pair (lexicographically smaller address) */
  token0: Address
  /** Second token in the pair (lexicographically larger address) */
  token1: Address
  /** Pool fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%) */
  fee: number
}

/**
 * Pool discovery result
 * Used by: DexIndexer.discoverPoolForToken(), examples/stream/dex*.ts
 */
export interface PoolDiscoveryResult {
  /** Discovered pool metadata */
  pool: PoolMetadata
  /** Whether the target token is token0 or token1 in the pool */
  tokenPosition: 0 | 1
}

/**
 * Union type of all DEX events
 * Used by: src/stream/dex/stream.ts, src/stream/dex/indexer.ts
 */
export type DexEvent = SwapEvent
