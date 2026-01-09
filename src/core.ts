import type { Address, Hex } from 'viem'
import { createTrading, type Trading } from './trading/trading'
import { createTokenHelper, type TokenHelper } from './token/tokenHelper'
import { createCurveStream, type CurveStream, type CurveEventType } from './stream/curve'
import { createCurveIndexer, type CurveIndexer } from './indexer/curve'
import { createDexStream, type DexStream } from './stream/dex'
import { createDexIndexer, type DexIndexer } from './indexer/dex'
import { DEFAULT_NETWORK, type Network } from './common/constants'
import { calculateMinAmountOut } from './common/utils'

// ==================== Types ====================

export interface SDKConfig {
  rpcUrl: string
  privateKey: `0x${string}`
  network?: Network
  wsUrl?: string
}

export interface SimpleBuyParams {
  token: Address
  amountIn: bigint
  slippagePercent?: number
  to?: Address
  deadline?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

export interface SimpleSellParams {
  token: Address
  amountIn: bigint
  slippagePercent?: number
  to?: Address
  deadline?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

export interface NadFunSDK extends Omit<Trading, 'publicClient' | 'walletClient' | 'account'>, Omit<TokenHelper, 'publicClient' | 'walletClient' | 'account' | 'address'> {
  // Clients
  readonly publicClient: Trading['publicClient']
  readonly walletClient: Trading['walletClient']
  readonly account: Trading['account']
  readonly network: Network

  // Trade (simple)
  simpleBuy: (params: SimpleBuyParams) => Promise<Hex>
  simpleSell: (params: SimpleSellParams) => Promise<Hex>

  // Stream Factories
  createCurveStream: (options?: { tokens?: Address[]; eventTypes?: CurveEventType[] }) => CurveStream
  createCurveIndexer: () => CurveIndexer
  createDexStream: (pools: Address[]) => DexStream
  createDexIndexer: (pools: Address[]) => DexIndexer
}

// ==================== Factory ====================

export function initSDK(config: SDKConfig): NadFunSDK {
  const network = config.network ?? DEFAULT_NETWORK
  const trading = createTrading(config)
  const token = createTokenHelper(config)

  async function simpleBuy(params: SimpleBuyParams): Promise<Hex> {
    const { router, amount } = await trading.getAmountOut(params.token, params.amountIn, true)
    const amountOutMin = calculateMinAmountOut(amount, params.slippagePercent ?? 0.5)

    return trading.buy(
      {
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin,
        to: params.to ?? trading.account.address,
        deadline: params.deadline,
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      },
      router
    )
  }

  async function simpleSell(params: SimpleSellParams): Promise<Hex> {
    const { router, amount } = await trading.getAmountOut(params.token, params.amountIn, false)
    const amountOutMin = calculateMinAmountOut(amount, params.slippagePercent ?? 0.5)

    await token.approve(params.token, router, params.amountIn)

    return trading.sell(
      {
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin,
        to: params.to ?? trading.account.address,
        deadline: params.deadline,
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      },
      router
    )
  }

  return {
    ...trading,
    ...token,
    network,
    simpleBuy,
    simpleSell,
    createCurveStream: (options) => {
      if (!config.wsUrl) {
        throw new Error('wsUrl is required in SDKConfig to use createCurveStream')
      }
      return createCurveStream({ wsUrl: config.wsUrl, network, ...options })
    },
    createCurveIndexer: () => createCurveIndexer({ rpcUrl: config.rpcUrl, network }),
    createDexStream: (pools) => {
      if (!config.wsUrl) {
        throw new Error('wsUrl is required in SDKConfig to use createDexStream')
      }
      return createDexStream({ wsUrl: config.wsUrl, pools, network })
    },
    createDexIndexer: (pools) => createDexIndexer({ rpcUrl: config.rpcUrl, pools, network }),
  }
}
