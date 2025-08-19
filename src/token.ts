import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  formatUnits,
  erc20Abi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Address, PrivateKeyAccount } from 'viem'
import type { TokenMetadata } from '@/types'
import type { PublicClient, WalletClient } from 'viem'
import { CURRENT_CHAIN } from '@/constants'

export class Token {
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
  }

  async getBalance(token: Address, address?: Address): Promise<bigint> {
    const addr = address || this.account.address
    const contract = getContract({
      address: token,
      abi: erc20Abi,
      client: this.publicClient,
    })
    const balance = (await contract.read.balanceOf([addr])) as bigint
    return balance
  }

  async getAllowance(token: Address, spender: Address, owner?: Address): Promise<bigint> {
    const ownerAddr = owner || this.account.address
    const allowance = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [ownerAddr, spender],
    })
    return allowance
  }

  async getMetadata(token: Address): Promise<TokenMetadata> {
    const [name, symbol, decimals, totalSupply] = await this.publicClient.multicall({
      contracts: [
        { address: token, abi: erc20Abi, functionName: 'name' },
        { address: token, abi: erc20Abi, functionName: 'symbol' },
        { address: token, abi: erc20Abi, functionName: 'decimals' },
        { address: token, abi: erc20Abi, functionName: 'totalSupply' },
      ],
    })

    return {
      name: name.result as string,
      symbol: symbol.result as string,
      decimals: Number(decimals.result),
      totalSupply: totalSupply.result as bigint,
      address: token,
    }
  }

  async approve(
    token: Address,
    spender: Address,
    amount: bigint,
    options?: { gasLimit?: bigint }
  ): Promise<string> {
    const txParams: any = {
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
      account: this.account,
      chain: CURRENT_CHAIN,
    }

    if (options?.gasLimit) {
      txParams.gas = options.gasLimit
    }

    const tx = await this.walletClient.writeContract(txParams)
    return tx
  }

  async transfer(
    token: Address,
    to: Address,
    amount: bigint,
    options?: { gasLimit?: bigint }
  ): Promise<string> {
    const txParams: any = {
      address: token,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
      account: this.account,
      chain: CURRENT_CHAIN,
    }

    if (options?.gasLimit) {
      txParams.gas = options.gasLimit
    }

    const tx = await this.walletClient.writeContract(txParams)
    return tx
  }

  async checkAndApprove(
    token: Address,
    spender: Address,
    requiredAmount: bigint,
    options?: {
      forceNew?: boolean
      gasLimit?: bigint
    }
  ): Promise<string | null> {
    if (!options?.forceNew) {
      const currentAllowance = await this.getAllowance(token, spender)
      if (currentAllowance >= requiredAmount) {
        return null
      }
    }

    // Use max uint256 for infinite approval if amount is large
    const maxUint256 = 2n ** 256n - 1n
    const approvalAmount = requiredAmount > 10n ** 24n ? maxUint256 : requiredAmount

    return await this.approve(token, spender, approvalAmount, { gasLimit: options?.gasLimit })
  }

  async getBalanceFormatted(token: Address, address?: Address): Promise<[bigint, string]> {
    const balance = await this.getBalance(token, address)
    const contract = getContract({
      address: token as `0x${string}`,
      abi: erc20Abi,
      client: this.publicClient,
    })
    const decimals = await contract.read.decimals()

    const formatted = formatUnits(balance, Number(decimals))
    return [balance, formatted]
  }

  get address(): string {
    return this.account.address
  }
}
