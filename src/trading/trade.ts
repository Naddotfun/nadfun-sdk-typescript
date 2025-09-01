import type { Address, GetContractReturnType, PrivateKeyAccount } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import type {
  BuyParams,
  SellParams,
  QuoteResult,
  CurveState,
  SellPermitParams,
  GasEstimationParams,
  AvailableBuyTokens,
} from '@/types'

import { createPublicClient, createWalletClient, http, getContract, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CURRENT_CHAIN } from '@/constants'
import { bondingCurveRouterAbi, curveAbi, dexRouterAbi, lensAbi, routerAbi } from '@/abis'

import { estimateGas as standaloneEstimateGas } from '@/trading/gas'

export class Trade {
  public lens: GetContractReturnType<typeof lensAbi, PublicClient, Address>
  public curve: GetContractReturnType<typeof curveAbi, PublicClient, Address>
  public curveRouter: GetContractReturnType<typeof bondingCurveRouterAbi, PublicClient, Address>
  public dexRouter: GetContractReturnType<typeof dexRouterAbi, PublicClient, Address>
  public publicClient: PublicClient
  public walletClient: WalletClient
  public account: PrivateKeyAccount

  constructor(rpcUrl: string, privateKey: string) {
    this.publicClient = createPublicClient({
      chain: CURRENT_CHAIN,
      transport: http(rpcUrl),
    })

    this.account = privateKeyToAccount(privateKey as `0x${string}`)

    this.walletClient = createWalletClient({
      account: this.account,
      chain: CURRENT_CHAIN,
      transport: http(rpcUrl),
    })

    this.lens = getContract({
      address: CONTRACTS.MONAD_TESTNET.LENS,
      abi: lensAbi,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    })

    this.curve = getContract({
      address: CONTRACTS.MONAD_TESTNET.CURVE,
      abi: curveAbi,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    })

    this.curveRouter = getContract({
      address: CONTRACTS.MONAD_TESTNET.BONDING_CURVE_ROUTER,
      abi: bondingCurveRouterAbi,
      client: this.publicClient,
    })

    this.dexRouter = getContract({
      address: CONTRACTS.MONAD_TESTNET.DEX_ROUTER,
      abi: dexRouterAbi,
      client: this.publicClient,
    })
  }

  async getAmountOut(token: Address, amountIn: bigint, isBuy: boolean): Promise<QuoteResult> {
    try {
      const result = (await this.lens.read.getAmountOut([token, amountIn, isBuy])) as [
        Address,
        bigint,
      ]
      return {
        router: result[0],
        amount: BigInt(result[1]),
      }
    } catch (error) {
      console.error('getAmountOut error:', error)
      throw error
    }
  }

  async getAmountIn(token: Address, amountOut: bigint, isBuy: boolean): Promise<QuoteResult> {
    try {
      const result = (await this.lens.read.getAmountIn([token, amountOut, isBuy])) as [
        Address,
        bigint,
      ]
      return {
        router: result[0],
        amount: BigInt(result[1]),
      }
    } catch (error) {
      console.error('getAmountIn error:', error)
      throw error
    }
  }

  ///////////////////////////////////////////////////////////
  //////////////////TRADE FUNCTIONS///////////////////////////
  ///////////////////////////////////////////////////////////

  async buy(params: BuyParams, router: Address): Promise<string> {
    const buyDataParams = {
      amountOutMin: params.amountOutMin,
      token: params.token,
      to: params.to,
      deadline: params.deadline
        ? BigInt(params.deadline)
        : BigInt(Math.floor(Date.now() / 1000) + 3600),
    }
    const callData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'buy',
      args: [buyDataParams],
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: callData,
      value: params.amountIn,
      gas: params.gasLimit,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      chain: CURRENT_CHAIN,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
  }

  /**
   * Pure sell function - executes sell without checking allowance
   * Faster execution for bots and advanced users who manage approvals separately
   */
  async sell(params: SellParams, router: Address): Promise<string> {
    const sellDataParams = {
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      token: params.token,
      to: params.to,
      deadline: params.deadline
        ? BigInt(params.deadline)
        : BigInt(Math.floor(Date.now() / 1000) + 3600),
    }

    const sellData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'sell',
      args: [sellDataParams],
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellData,
      gas: params.gasLimit,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      chain: CURRENT_CHAIN,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
  }

  /**
   * Sell with permit - optimized for speed
   * If permitNonce is provided, skips nonce reading (faster for bots)
   */
  async sellPermit(params: SellPermitParams, router: Address): Promise<string> {
    const sellPermitDataParams = {
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      amountAllowance: params.amountAllowance,
      token: params.token,
      to: params.to,
      deadline: BigInt(params.deadline),
      v: params.v,
      r: params.r,
      s: params.s,
    }
    const sellPermitData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'sellPermit',
      args: [sellPermitDataParams],
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellPermitData,
      gas: params.gasLimit,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      chain: CURRENT_CHAIN,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
  }

  async getAvailableBuyTokens(token: Address): Promise<AvailableBuyTokens> {
    const [availableBuyToken, requiredMonAmount] = (await this.curveRouter.read.availableBuyTokens([
      token,
    ])) as [bigint, bigint]

    return {
      availableBuyToken,
      requiredMonAmount,
    }
  }

  async getCurveState(token: Address): Promise<CurveState> {
    const [
      realMonReserve,
      realTokenReserve,
      virtualMonReserve,
      virtualTokenReserve,
      k,
      targetTokenAmount,
      initVirtualMonReserve,
      initVirtualTokenReserve,
    ] = (await this.curve.read.curves([token])) as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ]

    return {
      realMonReserve,
      realTokenReserve,
      virtualMonReserve,
      virtualTokenReserve,
      k,
      targetTokenAmount,
      initVirtualMonReserve,
      initVirtualTokenReserve,
    }
  }

  async isListed(token: Address): Promise<boolean> {
    return (await this.curve.read.isListed([token])) as boolean
  }

  async isLocked(token: Address): Promise<boolean> {
    return (await this.curve.read.isLocked([token])) as boolean
  }

  /**
   * Estimate gas for trading operations using the unified gas estimation system
   *
   * This is a convenience method that wraps the standalone estimateGas function
   * and automatically provides the publicClient and handles the common use case.
   *
   * @example
   * ```typescript
   * import { Trade, GasEstimationParams } from '@nadfun/sdk'
   *
   * const params: GasEstimationParams = {
   *   type: 'Buy',
   *   token,
   *   amountIn: monAmount,
   *   amountOutMin: minTokens,
   *   to: wallet,
   *   deadline,
   * }
   *
   * const estimatedGas = await trade.estimateGas(routerAddress, params)
   * const gasWithBuffer = (estimatedGas * 120n) / 100n // Add 20% buffer
   * ```
   */
  async estimateGas(routerAddress: Address, params: GasEstimationParams): Promise<bigint> {
    const estimatedGas = await standaloneEstimateGas(this.publicClient, routerAddress, params)

    return estimatedGas
  }
}
