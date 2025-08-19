import { Address } from 'viem'

// Base event interface - common to all stream events
export interface BaseEvent {
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  logIndex: number
  address: Address
  timestamp?: number
}

// Generic stream configuration
export interface StreamConfig {
  wsUrl?: string
  rpcUrl?: string
  addresses?: Address[]
  fromBlock?: number | 'latest'
  toBlock?: number | 'latest'
  batchSize?: number
}

// Generic event filter
export interface EventFilter {
  addresses?: Address[]
  tokens?: Address[]
}
