import { Address } from 'viem'

/**
 * Stream Common Types
 * Used by: src/stream/*.ts, src/stream/curve/*.ts, src/stream/dex/*.ts
 */

/**
 * Base event interface - common to all stream events
 * Used by: All event types as a base interface
 */
export interface BaseEvent {
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
  /** Block timestamp (optional, added during processing) */
  timestamp?: number
}

/**
 * Generic stream configuration
 * Used by: Stream constructors, stream initialization
 */
export interface StreamConfig {
  /** WebSocket URL for real-time streaming (optional) */
  wsUrl?: string
  /** RPC URL for historical data and fallbacks (optional) */
  rpcUrl?: string
  /** Specific contract addresses to monitor (optional) */
  addresses?: Address[]
  /** Starting block for historical streaming (optional) */
  fromBlock?: number | 'latest'
  /** Ending block for historical streaming (optional) */
  toBlock?: number | 'latest'
  /** Number of blocks to process in each batch (optional) */
  batchSize?: number
}

/**
 * Generic event filter configuration
 * Used by: Stream filtering, event subscription setup
 */
export interface EventFilter {
  /** Contract addresses to filter events from (optional) */
  addresses?: Address[]
  /** Token addresses for token-specific filtering (optional) */
  tokens?: Address[]
}

/**
 * Stream event handler function type
 * Used by: Stream.on('event', handler), event subscription callbacks
 */
export type EventHandler<T> = (event: T) => void

/**
 * Stream error handler function type
 * Used by: Stream.on('error', handler), error handling callbacks
 */
export type ErrorHandler = (error: Error) => void

/**
 * Stream connection status
 * Used by: Stream status tracking, connection monitoring
 */
export enum StreamStatus {
  /** Stream is not connected */
  Disconnected = 'disconnected',
  /** Stream is attempting to connect */
  Connecting = 'connecting',
  /** Stream is connected and active */
  Connected = 'connected',
  /** Stream has encountered an error */
  Error = 'error',
  /** Stream has been stopped */
  Stopped = 'stopped',
}
