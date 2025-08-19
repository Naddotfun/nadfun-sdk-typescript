// Curve Event types for streaming
export enum CurveEventType {
  Create = 'Create',
  Buy = 'Buy',
  Sell = 'Sell',
  Sync = 'Sync',
  Lock = 'Lock',
  Listed = 'Listed',
}

// Bonding Curve event types
export interface BuyEvent {
  type: 'Buy'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  sender: string
  amountIn: bigint
  amountOut: bigint
  timestamp?: number
}

export interface SellEvent {
  type: 'Sell'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  sender: string
  amountIn: bigint
  amountOut: bigint
  timestamp?: number
}

export interface CreateEvent {
  type: 'Create'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  creator: string
  pool: string
  name: string
  symbol: string
  tokenURI: string
  virtualMon: bigint
  virtualToken: bigint
  targetTokenAmount: bigint
  timestamp?: number
}

export interface SyncEvent {
  type: 'Sync'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  realMonReserve: bigint
  realTokenReserve: bigint
  virtualMonReserve: bigint
  virtualTokenReserve: bigint
  timestamp?: number
}

export interface LockEvent {
  type: 'Lock'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  timestamp?: number
}

export interface ListedEvent {
  type: 'Listed'
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: string
  token: string
  pool: string
  timestamp?: number
}

export type BondingCurveEvent =
  | CreateEvent
  | BuyEvent
  | SellEvent
  | SyncEvent
  | LockEvent
  | ListedEvent
