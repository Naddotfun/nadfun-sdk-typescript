import { Address } from 'viem'

export interface BuyParams {
  token: Address
  to: Address
  amountIn: bigint
  amountOutMin: bigint
  deadline?: number
}

export interface SellParams {
  token: Address
  to: Address
  amountIn: bigint
  amountOutMin: bigint
  deadline?: number
}

export interface SellPermitParams {
  token: Address
  to: Address
  amountIn: bigint
  amountOutMin: bigint
  amountAllowance: bigint
  deadline?: number
}

export interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: string
}

export interface QuoteResult {
  router: Address
  amount: bigint
}

export interface CurveData {
  reserveMON: bigint
  reserveToken: bigint
  k: bigint
  tokenSupply: bigint
  virtualMON: bigint
  virtualToken: bigint
  fee: bigint
  listed: boolean
}
