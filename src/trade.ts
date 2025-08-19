import type { Address, GetContractReturnType, PrivateKeyAccount } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import type { BuyParams, SellParams, QuoteResult, CurveData, SellPermitParams } from '@/types'

import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  encodeFunctionData,
  erc20Abi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACTS, CURRENT_CHAIN, DEFAULT_DEADLINE_SECONDS } from '@/constants'
import { BONDING_ROUTER_GAS_CONFIG, DEX_ROUTER_GAS_CONFIG } from '@/utils/gasConfig'
import { curveAbi, lensAbi, routerAbi } from '@/abis'
import { getPermitSignature } from './utils/permit'

export interface GasConfig {
  bondingRouter?: {
    buy?: bigint
    sell?: bigint
    sellPermit?: bigint
  }
  dexRouter?: {
    buy?: bigint
    sell?: bigint
    sellPermit?: bigint
  }
}

export class Trade {
  public lens: GetContractReturnType<typeof lensAbi, PublicClient, Address>
  public curve: GetContractReturnType<typeof curveAbi, PublicClient, Address>
  public publicClient: PublicClient
  public walletClient: WalletClient
  public account: PrivateKeyAccount
  public gasConfig: Required<GasConfig>

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

    const allowance = await this.publicClient.readContract({
      address: params.token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [this.account.address, router],
    })

    if (allowance < params.amountIn) {
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [router, params.amountIn],
      })

      const gasLimit = await this.publicClient.estimateGas({
        account: this.account,
        to: params.token,
        data: approveData,
      })

      const approveTx = await this.walletClient.sendTransaction({
        account: this.account,
        to: params.token,
        data: approveData,
        gas: gasLimit,
        nonce: options?.nonce,
        chain: CURRENT_CHAIN,
      })
      return approveTx
    }

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

    const nonce = await this.publicClient.readContract({
      address: params.token,
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
    })

    const signature = await getPermitSignature({
      owner: this.account.address,
      spender: router,
      value: params.amountIn,
      nonce: nonce,
      deadline: BigInt(deadline),
      chainId: CURRENT_CHAIN.id,
      token: params.token,
      account: this.account.address,
      walletClient: this.walletClient,
      publicClient: this.publicClient,
    })

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
