import type { Address, GetContractReturnType, PrivateKeyAccount } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import type {
  BuyParams,
  SellParams,
  QuoteResult,
  CurveData,
  SellPermitParams,
  GasConfig,
  GasEstimationParams,
} from '@/types'

import { createPublicClient, createWalletClient, http, getContract, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CURRENT_CHAIN, DEFAULT_DEADLINE_SECONDS } from '@/constants'
import { BONDING_ROUTER_GAS_CONFIG, DEX_ROUTER_GAS_CONFIG } from '@/utils/gasConfig'
import { curveAbi, lensAbi, routerAbi } from '@/abis'
import { Token } from './token'

import { estimateGas as standaloneEstimateGas } from '@/utils/gas'

export class Trade {
  public lens: GetContractReturnType<typeof lensAbi, PublicClient, Address>
  public curve: GetContractReturnType<typeof curveAbi, PublicClient, Address>
  public publicClient: PublicClient
  public walletClient: WalletClient
  public account: PrivateKeyAccount
  public gasConfig: Required<GasConfig>
  private tokenManager: Token

  constructor(rpcUrl: string, privateKey: string, gasConfig?: GasConfig) {
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

    this.gasConfig = {
      bondingRouter: {
        buy: gasConfig?.bondingRouter?.buy ?? BONDING_ROUTER_GAS_CONFIG.BUY,
        sell: gasConfig?.bondingRouter?.sell ?? BONDING_ROUTER_GAS_CONFIG.SELL,
        sellPermit: gasConfig?.bondingRouter?.sellPermit ?? BONDING_ROUTER_GAS_CONFIG.SELL_PERMIT,
      },
      dexRouter: {
        buy: gasConfig?.dexRouter?.buy ?? DEX_ROUTER_GAS_CONFIG.BUY,
        sell: gasConfig?.dexRouter?.sell ?? DEX_ROUTER_GAS_CONFIG.SELL,
        sellPermit: gasConfig?.dexRouter?.sellPermit ?? DEX_ROUTER_GAS_CONFIG.SELL_PERMIT,
      },
    }

    // Initialize token manager for delegation
    this.tokenManager = new Token(rpcUrl, privateKey)

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
      /** Use custom gas estimation instead of GasConfig defaults (default: true) */
      customGas?: boolean
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

    let gas: bigint
    if (options?.customGas !== false) {
      const estimationParams: GasEstimationParams = {
        type: 'Buy',
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin: params.amountOutMin,
        to: params.to,
        deadline: BigInt(deadline),
      }

      gas = await this.estimateGas(router, estimationParams, {
        bufferPercent: options?.gasBufferPercent,
      })
    } else {
      const routerType = options?.routerType ?? 'bonding'
      gas = (
        routerType === 'dex' ? this.gasConfig.dexRouter.buy : this.gasConfig.bondingRouter.buy
      ) as bigint
    }

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
      /** Use custom gas estimation instead of GasConfig defaults (default: true) */
      customGas?: boolean
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

    let gas: bigint
    if (options?.customGas !== false) {
      const estimationParams: GasEstimationParams = {
        type: 'Sell',
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin: params.amountOutMin,
        to: params.to,
        deadline: BigInt(deadline),
      }

      gas = await this.estimateGas(router, estimationParams, {
        bufferPercent: options?.gasBufferPercent,
      })
    } else {
      const routerType = options?.routerType ?? 'bonding'
      gas = (
        routerType === 'dex' ? this.gasConfig.dexRouter.sell : this.gasConfig.bondingRouter.sell
      ) as bigint
    }

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
      customGas?: boolean
      gasBufferPercent?: number
    }
  ): Promise<string> {
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS

    const signature = await this.tokenManager.generatePermitSignature(
      params.token,
      router,
      params.amountIn,
      BigInt(deadline)
    )

    const sellPermitParams = {
      amountIn: params.amountIn,
      amountOutMin: params.amountOutMin,
      amountAllowance: params.amountAllowance,
      token: params.token,
      to: params.to,
      deadline: deadline,
      v: signature.v,
      r: signature.r,
      s: signature.s,
    }

    const sellPermitData = encodeFunctionData({
      abi: routerAbi,
      functionName: 'sellPermit',
      args: [sellPermitParams],
    })

    let gas: bigint
    if (options?.customGas !== false) {
      const estimationParams: GasEstimationParams = {
        type: 'SellPermit',
        token: params.token,
        amountIn: params.amountIn,
        amountOutMin: params.amountOutMin,
        to: params.to,
        deadline: BigInt(deadline),
        v: signature.v,
        r: signature.r as `0x${string}`,
        s: signature.s as `0x${string}`,
      }

      gas = await this.estimateGas(router, estimationParams, {
        bufferPercent: options?.gasBufferPercent,
      })
    } else {
      const routerType = options?.routerType ?? 'bonding'
      gas = (
        routerType === 'dex'
          ? this.gasConfig.dexRouter.sellPermit
          : this.gasConfig.bondingRouter.sellPermit
      ) as bigint
    }

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

  /**
   * Convenience function: sell with automatic approval if needed
   * Use this if you want the old behavior with automatic approval
   * Returns { approveTx?: string, sellTx: string }
   */
  async sellWithApprove(
    params: SellParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      approveGasLimit?: bigint
      nonce?: number
      /** Use custom gas estimation instead of GasConfig defaults (default: true) */
      customGas?: boolean
      /** Buffer percentage for gas estimation (e.g., 20 for 20% buffer) */
      gasBufferPercent?: number
    }
  ): Promise<{ approveTx?: string; sellTx: string }> {
    const allowance = await this.getAllowance(params.token, router)

    let approveTx: string | undefined

    if (allowance < params.amountIn) {
      // Need approval first
      approveTx = await this.approveToken(params.token, router, params.amountIn)

      // Wait a bit for approval to be mined
      console.log('⏳ Waiting for approval confirmation...')
      await this.publicClient.waitForTransactionReceipt({
        hash: approveTx as `0x${string}`,
      })
    }

    // Execute sell
    const sellTx = await this.sell(params, router, {
      routerType: options?.routerType,
      nonce: approveTx ? undefined : options?.nonce, // Don't reuse nonce if we used it for approve
      customGas: options?.customGas,
      gasBufferPercent: options?.gasBufferPercent,
    })

    return { approveTx, sellTx }
  }

  ///////////////////////////////////////////////////////////
  //////////////////TOKEN FUNCTIONS///////////////////////////
  ///////////////////////////////////////////////////////////

  /**
   * Check current allowance for a token and spender
   * Delegates to Token class for consistency
   */
  async getAllowance(token: Address, spender: Address): Promise<bigint> {
    return await this.tokenManager.getAllowance(token, spender)
  }

  /**
   * @deprecated Use getAllowance instead
   * Kept for backward compatibility
   */
  async checkAllowance(token: Address, spender: Address): Promise<bigint> {
    return await this.getAllowance(token, spender)
  }

  /**
   * Approve token spending - delegates to Token class with trade-specific optimizations
   * Returns transaction hash
   */
  async approveToken(token: Address, spender: Address, amount: bigint): Promise<string> {
    // Delegate to Token class
    return await this.tokenManager.approve(token, spender, amount)
  }

  /**
   * Get current nonce for permit signature
   * Separated for manual nonce management
   */
  async getNonce(token: Address): Promise<bigint> {
    return (await this.publicClient.readContract({
      address: token,
      abi: [
        {
          type: 'function',
          name: 'nonces',
          inputs: [
            {
              name: 'owner',
              type: 'address',
              internalType: 'address',
            },
          ],
          outputs: [
            {
              name: '',
              type: 'uint256',
              internalType: 'uint256',
            },
          ],
          stateMutability: 'view',
        },
      ],
      functionName: 'nonces',
      args: [this.account.address],
    })) as bigint
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

  getGasConfig(): Required<GasConfig> {
    return { ...this.gasConfig }
  }

  updateGasConfig(newConfig: Partial<GasConfig>): void {
    if (newConfig.bondingRouter) {
      this.gasConfig.bondingRouter = {
        ...this.gasConfig.bondingRouter,
        ...newConfig.bondingRouter,
      }
    }
    if (newConfig.dexRouter) {
      this.gasConfig.dexRouter = {
        ...this.gasConfig.dexRouter,
        ...newConfig.dexRouter,
      }
    }
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
