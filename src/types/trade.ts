import { Address } from 'viem'

/**
 * Trading Parameters and Configuration Types
 * Used by: src/Trade.ts, examples/trade/*.ts
 */

/**
 * Router types for gas estimation and contract interactions
 */
export enum RouterType {
  BondingCurve = 'BondingCurve',
  Dex = 'Dex',
}

/**
 * Router configuration with address and type
 */
export interface RouterConfig {
  address: Address
  type: RouterType
}

/**
 * Parameters for buying tokens on bonding curves
 * Used by: Trade.buy(), examples/trade/buy.ts
 */
export interface BuyParams {
  /** Token contract address to purchase */
  token: Address
  /** Recipient address for purchased tokens */
  to: Address
  /** Amount of MON to spend (in wei) */
  amountIn: bigint
  /** Minimum amount of tokens to receive (slippage protection) */
  amountOutMin: bigint
  /** Transaction deadline (unix timestamp, optional) */
  deadline: number
  /** Transaction deadline (unix timestamp, optional) */
  gasLimit?: bigint
  /** Gas price for the transaction */
  gasPrice?: bigint
  /** Nonce for the transaction */
  nonce?: number
}

/**
 * Parameters for selling tokens on bonding curves
 * Used by: Trade.sell(), Trade.sellWithApprove(), examples/trade/sell*.ts
 */
export interface SellParams {
  /** Token contract address to sell */
  token: Address
  /** Recipient address for received MON */
  to: Address
  /** Amount of tokens to sell (in wei) */
  amountIn: bigint
  /** Minimum amount of MON to receive (slippage protection) */
  amountOutMin: bigint
  /** Transaction deadline (unix timestamp, optional) */
  deadline: number
  /** Gas limit for the transaction */
  gasLimit?: bigint
  /** Gas price for the transaction */
  gasPrice?: bigint
  /** Nonce for the transaction */
  nonce?: number
}

/**
 * Parameters for selling tokens using EIP-2612 permit (gasless approval)
 * Used by: Trade.sellPermit(), examples/trade/sell_permit.ts
 */
export interface SellPermitParams extends SellParams {
  /** Amount to approve for spending via permit */
  amountAllowance: bigint
  /** Signature v, r, s */
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

/**
 * Quote result from pricing queries
 * Used by: Trade.getAmountOut(), Trade.getAmountIn()
 */
export interface QuoteResult {
  /** Router contract address to use for the trade */
  router: Address
  /** Calculated amount for the trade */
  amount: bigint
}

/**
 * Gas estimation parameters for different trading operations
 */
export type GasEstimationParams =
  | {
      type: 'Buy'
      token: Address
      amountIn: bigint
      amountOutMin: bigint
      to: Address
      deadline: bigint
    }
  | {
      type: 'Sell'
      token: Address
      amountIn: bigint
      amountOutMin: bigint
      to: Address
      deadline: bigint
    }
  | {
      type: 'SellPermit'
      token: Address
      amountIn: bigint
      amountOutMin: bigint
      amountAllowance: bigint
      to: Address
      deadline: bigint
      v: number
      r: `0x${string}`
      s: `0x${string}`
    }
