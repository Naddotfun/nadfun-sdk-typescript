import type { Address, PublicClient, WalletClient, PrivateKeyAccount } from 'viem'
import { createPublicClient, createWalletClient, http, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CHAINS, DEFAULT_NETWORK, type Network } from './constants'
import { curveAbi } from './abis/curve'
import { lensAbi } from './abis/lens'
import { routerAbi, bondingCurveRouterAbi } from './abis/router'

// ==================== Types ====================

export interface CoreConfig {
  rpcUrl: string
  privateKey: `0x${string}`
  network?: Network
}

export interface QuoteResult {
  router: Address
  amount: bigint
}

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

export interface AvailableBuyTokens {
  availableBuyToken: bigint
  requiredMonAmount: bigint
}

export interface TradeParams {
  token: Address
  to: Address
  amountIn: bigint
  amountOutMin: bigint
  deadline?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

export type BuyParams = TradeParams
export type SellParams = TradeParams

export interface SellPermitParams extends TradeParams {
  amountAllowance: bigint
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

interface BaseGasParams {
  token: Address
  amountIn: bigint
  amountOutMin: bigint
  to: Address
  deadline?: bigint
}

export type GasEstimationParams =
  | (BaseGasParams & { type: 'buy' })
  | (BaseGasParams & { type: 'sell' })
  | (BaseGasParams & {
      type: 'sellPermit'
      amountAllowance: bigint
      deadline: bigint
      v: number
      r: `0x${string}`
      s: `0x${string}`
    })

export interface Core {
  readonly publicClient: PublicClient
  readonly walletClient: WalletClient
  readonly account: PrivateKeyAccount

  getAmountOut: (token: Address, amountIn: bigint, isBuy: boolean) => Promise<QuoteResult>
  getAmountIn: (token: Address, amountOut: bigint, isBuy: boolean) => Promise<QuoteResult>

  buy: (params: BuyParams, router: Address) => Promise<`0x${string}`>
  sell: (params: SellParams, router: Address) => Promise<`0x${string}`>
  sellPermit: (params: SellPermitParams, router: Address) => Promise<`0x${string}`>

  getCurveState: (token: Address) => Promise<CurveState>
  getAvailableBuyTokens: (token: Address) => Promise<AvailableBuyTokens>
  isGraduated: (token: Address) => Promise<boolean>
  isLocked: (token: Address) => Promise<boolean>

  getProgress: (token: Address) => Promise<bigint>
  getInitialBuyAmountOut: (amountIn: bigint) => Promise<bigint>

  estimateGas: (routerAddress: Address, params: GasEstimationParams) => Promise<bigint>
}

// ==================== Factory ====================

export function createCore(config: CoreConfig): Core {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]
  const contracts = CONTRACTS[network]

  const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  })

  const account = privateKeyToAccount(config.privateKey)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  })

  return {
    publicClient,
    walletClient,
    account,

    async getAmountOut(token, amountIn, isBuy) {
      const [router, amount] = await publicClient.readContract({
        address: contracts.LENS,
        abi: lensAbi,
        functionName: 'getAmountOut',
        args: [token, amountIn, isBuy],
      })
      return { router, amount }
    },

    async getAmountIn(token, amountOut, isBuy) {
      const [router, amount] = await publicClient.readContract({
        address: contracts.LENS,
        abi: lensAbi,
        functionName: 'getAmountIn',
        args: [token, amountOut, isBuy],
      })
      return { router, amount }
    },

    async buy(params, router) {
      const hash = await walletClient.sendTransaction({
        account,
        to: router,
        data: encodeFunctionData({
          abi: routerAbi,
          functionName: 'buy',
          args: [
            {
              amountOutMin: params.amountOutMin,
              token: params.token,
              to: params.to,
              deadline: params.deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600),
            },
          ],
        }),
        value: params.amountIn,
        gas: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
        chain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.transactionHash
    },

    async sell(params, router) {
      const hash = await walletClient.sendTransaction({
        account,
        to: router,
        data: encodeFunctionData({
          abi: routerAbi,
          functionName: 'sell',
          args: [
            {
              amountIn: params.amountIn,
              amountOutMin: params.amountOutMin,
              token: params.token,
              to: params.to,
              deadline: params.deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600),
            },
          ],
        }),
        gas: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
        chain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.transactionHash
    },

    async sellPermit(params, router) {
      const hash = await walletClient.sendTransaction({
        account,
        to: router,
        data: encodeFunctionData({
          abi: routerAbi,
          functionName: 'sellPermit',
          args: [
            {
              amountIn: params.amountIn,
              amountOutMin: params.amountOutMin,
              amountAllowance: params.amountAllowance,
              token: params.token,
              to: params.to,
              deadline: params.deadline!,
              v: params.v,
              r: params.r,
              s: params.s,
            },
          ],
        }),
        gas: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
        chain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.transactionHash
    },

    async getCurveState(token) {
      const result = await publicClient.readContract({
        address: contracts.CURVE,
        abi: curveAbi,
        functionName: 'curves',
        args: [token],
      })
      return {
        realMonReserve: result[0],
        realTokenReserve: result[1],
        virtualMonReserve: result[2],
        virtualTokenReserve: result[3],
        k: result[4],
        targetTokenAmount: result[5],
        initVirtualMonReserve: result[6],
        initVirtualTokenReserve: result[7],
      }
    },

    async getAvailableBuyTokens(token) {
      const [availableBuyToken, requiredMonAmount] = await publicClient.readContract({
        address: contracts.BONDING_CURVE_ROUTER,
        abi: bondingCurveRouterAbi,
        functionName: 'availableBuyTokens',
        args: [token],
      })
      return { availableBuyToken, requiredMonAmount }
    },

    async isGraduated(token) {
      return publicClient.readContract({
        address: contracts.CURVE,
        abi: curveAbi,
        functionName: 'isGraduated',
        args: [token],
      })
    },

    async isLocked(token) {
      return publicClient.readContract({
        address: contracts.CURVE,
        abi: curveAbi,
        functionName: 'isLocked',
        args: [token],
      })
    },

    async getProgress(token) {
      return publicClient.readContract({
        address: contracts.LENS,
        abi: lensAbi,
        functionName: 'getProgress',
        args: [token],
      })
    },

    async getInitialBuyAmountOut(amountIn) {
      return publicClient.readContract({
        address: contracts.LENS,
        abi: lensAbi,
        functionName: 'getInitialBuyAmountOut',
        args: [amountIn],
      })
    },

    async estimateGas(routerAddress, params) {
      const defaultDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

      if (params.type === 'buy') {
        const callData = encodeFunctionData({
          abi: routerAbi,
          functionName: 'buy',
          args: [
            {
              amountOutMin: params.amountOutMin,
              token: params.token,
              to: params.to,
              deadline: params.deadline ?? defaultDeadline,
            },
          ],
        })
        return publicClient.estimateGas({
          account: account.address,
          to: routerAddress,
          data: callData,
          value: params.amountIn,
        })
      }

      if (params.type === 'sell') {
        const callData = encodeFunctionData({
          abi: routerAbi,
          functionName: 'sell',
          args: [
            {
              amountIn: params.amountIn,
              amountOutMin: params.amountOutMin,
              token: params.token,
              to: params.to,
              deadline: params.deadline ?? defaultDeadline,
            },
          ],
        })
        return publicClient.estimateGas({
          account: account.address,
          to: routerAddress,
          data: callData,
          value: 0n,
        })
      }

      // sellPermit
      const callData = encodeFunctionData({
        abi: routerAbi,
        functionName: 'sellPermit',
        args: [
          {
            amountIn: params.amountIn,
            amountOutMin: params.amountOutMin,
            amountAllowance: params.amountAllowance,
            token: params.token,
            to: params.to,
            deadline: params.deadline,
            v: params.v,
            r: params.r,
            s: params.s,
          },
        ],
      })
      return publicClient.estimateGas({
        account: account.address,
        to: routerAddress,
        data: callData,
        value: 0n,
      })
    },
  }
}
