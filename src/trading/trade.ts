import type { Address, GetContractReturnType, PrivateKeyAccount } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import type {
  BuyParams,
  SellParams,
  QuoteResult,
  CurveData,
  SellPermitParams,
  GasEstimationParams,
} from '@/types'

import { createPublicClient, createWalletClient, http, getContract, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CURRENT_CHAIN, DEFAULT_DEADLINE_SECONDS } from '@/constants'
import { curveAbi, lensAbi, routerAbi } from '@/abis'

import { estimateGas as standaloneEstimateGas } from '@/trading/gas'

export class Trade {
  public lens: GetContractReturnType<typeof lensAbi, PublicClient, Address>
  public curve: GetContractReturnType<typeof curveAbi, PublicClient, Address>
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

  async buy(
    params: BuyParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      nonce?: number
      /** Buffer percentage for gas estimation (e.g., 20 for 20% buffer) */
      gasBufferPercent?: number
    }
  ): Promise<string> {
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS

    const buyParams = {
      amountOutMin: params.amountOutMin,
      token: params.token,
      to: params.to,
      deadline: deadline,
    }

    const callData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'buy',
      args: [buyParams],
    })

    const estimationParams: GasEstimationParams = {
      type: 'Buy',
      token: params.token,
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      to: params.to,
      deadline: BigInt(deadline),
    }

    const gas = await this.estimateGas(router, estimationParams, {
      bufferPercent: options?.gasBufferPercent,
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: callData,
      value: params.amountIn,
      gas: gas,
      nonce: options?.nonce,
      chain: CURRENT_CHAIN,
    })

    return tx
  }

  /**
   * Pure sell function - executes sell without checking allowance
   * Faster execution for bots and advanced users who manage approvals separately
   */
  async sell(
    params: SellParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      nonce?: number

      /** Buffer percentage for gas estimation (e.g., 20 for 20% buffer) */
      gasBufferPercent?: number
    }
  ): Promise<string> {
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS

    const sellParams = {
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      token: params.token,
      to: params.to,
      deadline: deadline,
    }

    const sellData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'sell',
      args: [sellParams],
    })

    const estimationParams: GasEstimationParams = {
      type: 'Sell',
      token: params.token,
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      to: params.to,
      deadline: BigInt(deadline),
    }

    const gas = await this.estimateGas(router, estimationParams, {
      bufferPercent: options?.gasBufferPercent,
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellData,
      gas: gas,
      nonce: options?.nonce,
      chain: CURRENT_CHAIN,
    })

    return tx
  }

  /**
   * Sell with permit - optimized for speed
   * If permitNonce is provided, skips nonce reading (faster for bots)
   */
  async sellPermit(
    params: SellPermitParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      nonce?: number
      gasBufferPercent?: number
    }
  ): Promise<string> {
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS

    const sellPermitParams = {
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      amountAllowance: params.amountAllowance,
      token: params.token,
      to: params.to,
      deadline: deadline,
      v: params.v,
      r: params.r,
      s: params.s,
    }

    const sellPermitData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'sellPermit',
      args: [sellPermitParams],
    })

    const estimationParams: GasEstimationParams = {
      type: 'SellPermit',
      token: params.token,
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      to: params.to,
      deadline: BigInt(deadline),
      v: params.v,
      r: params.r,
      s: params.s,
    }

    const gas = await this.estimateGas(router, estimationParams, {
      bufferPercent: options?.gasBufferPercent,
    })

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellPermitData,
      gas: gas,
      nonce: options?.nonce,
      chain: CURRENT_CHAIN,
    })

    return tx
  }

  async isListed(token: Address): Promise<boolean> {
    return (await this.curve.read.isListed([token])) as boolean
  }

  async getCurves(token: Address): Promise<CurveData> {
    const data = (await this.curve.read.curves([token])) as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      boolean,
    ]
    return {
      reserveMON: data[0],
      reserveToken: data[1],
      k: data[2],
      tokenSupply: data[3],
      virtualMON: data[4],
      virtualToken: data[5],
      fee: data[6],
      listed: data[7],
    }
  }

  get address(): string {
    return this.account.address
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
  async estimateGas(
    routerAddress: Address,
    params: GasEstimationParams,
    options?: {
      /** Add a percentage buffer to the estimated gas (default: 0) */
      bufferPercent?: number
    }
  ): Promise<bigint> {
    const estimatedGas = await standaloneEstimateGas(this.publicClient, routerAddress, params)

    // Apply buffer if specified
    if (options?.bufferPercent && options.bufferPercent > 0) {
      const bufferMultiplier = BigInt(100 + options.bufferPercent)
      return (estimatedGas * bufferMultiplier) / 100n
    }

    return estimatedGas
  }
}
