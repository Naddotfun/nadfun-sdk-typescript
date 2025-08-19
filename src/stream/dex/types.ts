import { Address } from 'viem'

// DEX Event types for streaming
export enum DexEventType {
  Swap = 'Swap',
}

// Base DEX event interface
export interface BaseDexEvent {
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  timestamp?: number
}

// Uniswap V3 Swap event
export interface SwapEvent extends BaseDexEvent {
  type: 'Swap'
  pool: string
  sender: string
  recipient: string
  amount0: bigint
  amount1: bigint
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
}

// Pool metadata
export interface PoolMetadata {
  poolAddress: Address
  token0: Address
  token1: Address
  fee: number
}

export type DexEvent = SwapEvent
