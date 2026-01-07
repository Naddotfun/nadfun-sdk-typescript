import type { Address, PublicClient, WalletClient, PrivateKeyAccount } from 'viem'
import { createCore, type Core } from './core'
import { createTokenHelper, type TokenHelper } from './tokenHelper'
import { createCurveStream, type CurveStream } from './curveStream'
import { createCurveIndexer, type CurveIndexer } from './curveIndexer'
import { createDexStream, type DexStream } from './dexStream'
import { createDexIndexer, type DexIndexer } from './dexIndexer'
import { DEFAULT_NETWORK, type Network } from './constants'

// ==================== Types ====================

export interface SDKConfig {
  rpcUrl: string
  privateKey: `0x${string}`
  network?: Network
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

export interface NadFunSDK {
  // Clients
  readonly publicClient: PublicClient
  readonly walletClient: WalletClient
  readonly account: PrivateKeyAccount
  readonly network: Network

  // Core - Quote
  getAmountOut: Core['getAmountOut']
  getAmountIn: Core['getAmountIn']

  // Core - Trade (low-level)
  buy: Core['buy']
  sell: Core['sell']
  sellPermit: Core['sellPermit']

  // Trade (simple) - SDK level
  simpleBuy: (params: SimpleBuyParams) => Promise<`0x${string}`>
  simpleSell: (params: SimpleSellParams) => Promise<`0x${string}`>

  // Core - Curve State
  getCurveState: Core['getCurveState']
  getAvailableBuyTokens: Core['getAvailableBuyTokens']
  isGraduated: Core['isGraduated']
  isLocked: Core['isLocked']
  getProgress: Core['getProgress']
  getInitialBuyAmountOut: Core['getInitialBuyAmountOut']

  // Core - Gas
  estimateGas: Core['estimateGas']

  // Token
  getBalance: TokenHelper['getBalance']
  getBalanceFormatted: TokenHelper['getBalanceFormatted']
  getAllowance: TokenHelper['getAllowance']
  getMetadata: TokenHelper['getMetadata']
  getDecimals: TokenHelper['getDecimals']
  getName: TokenHelper['getName']
  getSymbol: TokenHelper['getSymbol']
  getTotalSupply: TokenHelper['getTotalSupply']
  getNonce: TokenHelper['getNonce']
  approve: TokenHelper['approve']
  transfer: TokenHelper['transfer']
  generatePermitSignature: TokenHelper['generatePermitSignature']
  isContract: TokenHelper['isContract']
  batchGetBalances: TokenHelper['batchGetBalances']
  batchGetMetadata: TokenHelper['batchGetMetadata']

  // Stream Factories
  createCurveStream: (wsUrl: string) => CurveStream
  createCurveIndexer: () => CurveIndexer
  createDexStream: (wsUrl: string, pools: Address[]) => DexStream
  createDexIndexer: (pools: Address[]) => DexIndexer
}

// ==================== Helpers ====================

function calculateMinAmount(amount: bigint, slippagePercent: number): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100))
  return (amount * (10000n - slippageBps)) / 10000n
}

// ==================== Factory ====================

export function initSDK(config: SDKConfig): NadFunSDK {
  const network = config.network ?? DEFAULT_NETWORK
  const core = createCore(config)
  const token = createTokenHelper(config)

  async function simpleBuy(params: SimpleBuyParams): Promise<`0x${string}`> {
    const { router, amount } = await core.getAmountOut(params.token, params.amountIn, true)
    const amountOutMin = calculateMinAmount(amount, params.slippagePercent ?? 0.5)

    return core.buy(
      {
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin,
        to: params.to ?? core.account.address,
        deadline: params.deadline,
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      },
      router
    )
  }

  async function simpleSell(params: SimpleSellParams): Promise<`0x${string}`> {
    const { router, amount } = await core.getAmountOut(params.token, params.amountIn, false)
    const amountOutMin = calculateMinAmount(amount, params.slippagePercent ?? 0.5)

    // Approve first
    await token.approve(params.token, router, params.amountIn)

    return core.sell(
      {
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin,
        to: params.to ?? core.account.address,
        deadline: params.deadline,
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      },
      router
    )
  }

  return {
    // Clients
    publicClient: core.publicClient,
    walletClient: core.walletClient,
    account: core.account,
    network,

    // Core - Quote
    getAmountOut: core.getAmountOut,
    getAmountIn: core.getAmountIn,

    // Core - Trade (low-level)
    buy: core.buy,
    sell: core.sell,
    sellPermit: core.sellPermit,

    // Trade (simple) - SDK level
    simpleBuy,
    simpleSell,

    // Core - Curve State
    getCurveState: core.getCurveState,
    getAvailableBuyTokens: core.getAvailableBuyTokens,
    isGraduated: core.isGraduated,
    isLocked: core.isLocked,
    getProgress: core.getProgress,
    getInitialBuyAmountOut: core.getInitialBuyAmountOut,

    // Core - Gas
    estimateGas: core.estimateGas,

    // Token
    getBalance: token.getBalance,
    getBalanceFormatted: token.getBalanceFormatted,
    getAllowance: token.getAllowance,
    getMetadata: token.getMetadata,
    getDecimals: token.getDecimals,
    getName: token.getName,
    getSymbol: token.getSymbol,
    getTotalSupply: token.getTotalSupply,
    getNonce: token.getNonce,
    approve: token.approve,
    transfer: token.transfer,
    generatePermitSignature: token.generatePermitSignature,
    isContract: token.isContract,
    batchGetBalances: token.batchGetBalances,
    batchGetMetadata: token.batchGetMetadata,

    // Stream Factories
    createCurveStream: (wsUrl) => createCurveStream({ wsUrl, network }),
    createCurveIndexer: () => createCurveIndexer({ rpcUrl: config.rpcUrl, network }),
    createDexStream: (wsUrl, pools) => createDexStream({ wsUrl, pools, network }),
    createDexIndexer: (pools) => createDexIndexer({ rpcUrl: config.rpcUrl, pools, network }),
  }
}
