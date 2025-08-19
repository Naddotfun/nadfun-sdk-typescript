import type { Address, GetContractReturnType, PrivateKeyAccount } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import type {
  BuyParams,
  SellParams,
  QuoteResult,
  CurveData,
  SellPermitParams,
  GasConfig,
} from '@/types'

import { createPublicClient, createWalletClient, http, getContract, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CURRENT_CHAIN, DEFAULT_DEADLINE_SECONDS } from '@/constants'
import { BONDING_ROUTER_GAS_CONFIG, DEX_ROUTER_GAS_CONFIG } from '@/utils/gasConfig'
import { curveAbi, lensAbi, routerAbi } from '@/abis'
// Permit functionality now handled by Token class
import { Token } from './token'

// GasConfig moved to src/types/trade.ts

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

  async buy(
    params: BuyParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      gasLimit?: bigint
      nonce?: number
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

    let gasLimit = options?.gasLimit
    if (!gasLimit) {
      const routerType = options?.routerType ?? 'bonding'
      gasLimit =
        routerType === 'dex' ? this.gasConfig.dexRouter.buy : this.gasConfig.bondingRouter.buy
    }

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: callData,
      value: params.amountIn,
      gas: gasLimit,
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
      gasLimit?: bigint
      nonce?: number
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

    let gasLimit = options?.gasLimit
    if (!gasLimit) {
      const routerType = options?.routerType ?? 'bonding'
      gasLimit =
        routerType === 'dex' ? this.gasConfig.dexRouter.sell : this.gasConfig.bondingRouter.sell
    }

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellData,
      gas: gasLimit,
      nonce: options?.nonce,
      chain: CURRENT_CHAIN,
    })

    return tx
  }

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
  async approveToken(
    token: Address,
    spender: Address,
    amount: bigint,
    options?: {
      gasLimit?: bigint
      nonce?: number
    }
  ): Promise<string> {
    // Delegate to Token class but maintain trade-specific gas optimization if needed
    return await this.tokenManager.approve(token, spender, amount, {
      gasLimit: options?.gasLimit,
    })
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
      gasLimit?: bigint
      approveGasLimit?: bigint
      nonce?: number
    }
  ): Promise<{ approveTx?: string; sellTx: string }> {
    const allowance = await this.getAllowance(params.token, router)

    let approveTx: string | undefined

    if (allowance < params.amountIn) {
      // Need approval first
      approveTx = await this.approveToken(params.token, router, params.amountIn, {
        gasLimit: options?.approveGasLimit,
        nonce: options?.nonce,
      })

      // Wait a bit for approval to be mined
      console.log('⏳ Waiting for approval confirmation...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Execute sell
    const sellTx = await this.sell(params, router, {
      routerType: options?.routerType,
      gasLimit: options?.gasLimit,
      nonce: approveTx ? undefined : options?.nonce, // Don't reuse nonce if we used it for approve
    })

    return { approveTx, sellTx }
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

  /**
   * Sell with permit - optimized for speed
   * If permitNonce is provided, skips nonce reading (faster for bots)
   */
  async sellPermit(
    params: SellPermitParams,
    router: Address,
    options?: {
      routerType?: 'bonding' | 'dex'
      gasLimit?: bigint
      nonce?: number
    }
  ): Promise<string> {
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS

    // Generate permit signature using Token class
    let signature: { v: number; r: string; s: string; nonce: bigint }

    if (params.permitNonce !== undefined) {
      // Use provided nonce - delegate to Token's internal method
      signature = await (this.tokenManager as any)['_generatePermitSignature'](
        this.account.address,
        router,
        params.amountIn,
        params.permitNonce,
        BigInt(deadline),
        params.token
      )
      signature.nonce = params.permitNonce
    } else {
      // Use Token's convenience method that reads nonce automatically
      signature = await this.tokenManager.generatePermitSignature(
        params.token,
        router,
        params.amountIn,
        BigInt(deadline)
      )
    }

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

    let gasLimit = options?.gasLimit
    if (!gasLimit) {
      const routerType = options?.routerType ?? 'bonding'
      gasLimit =
        routerType === 'dex'
          ? this.gasConfig.dexRouter.sellPermit
          : this.gasConfig.bondingRouter.sellPermit
    }

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: router,
      data: sellPermitData,
      gas: gasLimit,
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
}
