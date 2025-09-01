import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  formatUnits,
  encodeFunctionData,
  erc20Abi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Address, PrivateKeyAccount } from 'viem'
import type { TokenMetadata } from '@/types'
import type { PublicClient, WalletClient } from 'viem'
import { CURRENT_CHAIN } from '@/constants'
import { Hex } from 'viem'
import tokenAbi from '@/abis/token'

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
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
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
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
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

  /**
   * Get token decimals only
   */
  async getDecimals(token: Address): Promise<number> {
    const decimals = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'decimals',
    })
    return Number(decimals)
  }

  /**
   * Get token name only
   */
  async getName(token: Address): Promise<string> {
    try {
      const name = await this.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'name',
      })
      return name as string
    } catch {
      return 'Unknown'
    }
  }

  /**
   * Get token symbol only
   */
  async getSymbol(token: Address): Promise<string> {
    try {
      const symbol = await this.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'symbol',
      })
      return symbol as string
    } catch {
      return 'UNKNOWN'
    }
  }

  /**
   * Get total supply only
   */
  async getTotalSupply(token: Address): Promise<bigint> {
    const totalSupply = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'totalSupply',
    })
    return totalSupply
  }

  /**
   * Get nonce for permit signatures (EIP-2612)
   */
  async getNonce(token: Address, owner?: Address): Promise<bigint> {
    const ownerAddr = owner || this.account.address
    const nonce = await this.publicClient.readContract({
      address: token,
      abi: tokenAbi,
      functionName: 'nonces',
      args: [ownerAddr],
    })
    return nonce as bigint
  }

  /**
   * Generate EIP-2612 permit signature (internal method)
   * Used by generatePermitSignature and other permit-related functions
   */
  private async _generatePermitSignature(
    owner: Address,
    spender: Address,
    value: bigint,
    nonce: bigint,
    deadline: bigint,
    token: Address
  ): Promise<{ v: number; r: string; s: string }> {
    try {
      // Get token name from contract for EIP-712 domain
      let tokenName = ''
      try {
        tokenName = (await this.publicClient.readContract({
          address: token,
          abi: [
            {
              type: 'function',
              name: 'name',
              inputs: [],
              outputs: [{ name: '', type: 'string' }],
              stateMutability: 'view',
            },
          ],
          functionName: 'name',
        })) as string
      } catch {
        // Fallback to empty string if name() is not available
        tokenName = ''
      }

      const domain = {
        name: tokenName,
        version: '1',
        chainId: CURRENT_CHAIN.id,
        verifyingContract: token,
      }

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      }

      const message = {
        owner,
        spender,
        value,
        nonce,
        deadline,
      }

      const signature = await this.walletClient.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      } as any)

      // Parse signature
      const sig = signature.slice(2)
      const r = `0x${sig.substring(0, 64)}` as Hex
      const s = `0x${sig.substring(64, 128)}` as Hex
      const v = parseInt(sig.substring(128, 130), 16)

      return { v, r, s }
    } catch (error: any) {
      // Wallet specific error messages
      if (error?.message?.includes('signTypedData')) {
        throw new Error(
          'Wallet does not support permit signing. Please use regular approval method.'
        )
      }

      if (error?.message?.includes('User rejected')) {
        throw new Error('User cancelled the signature.')
      }

      // Re-throw original error
      throw error
    }
  }

  /**
   * Generate complete permit signature
   * This combines nonce reading + signature generation for convenience
   */
  async generatePermitSignature(
    token: Address,
    spender: Address,
    value: bigint,
    deadline: bigint,
    owner?: Address
  ): Promise<{ v: number; r: string; s: string; nonce: bigint }> {
    const ownerAddr = owner || this.account.address

    // Get current nonce
    const nonce = await this.getNonce(token, ownerAddr)

    // Generate permit signature using internal method
    const signature = await this._generatePermitSignature(
      ownerAddr,
      spender,
      value,
      nonce,
      deadline,
      token
    )

    return {
      ...signature,
      nonce, // Return nonce for reference
    }
  }

  /**
   * Burn tokens from caller's account (ERC20Burnable)
   */
  async burn(token: Address, amount: bigint, options?: { gasLimit?: bigint }): Promise<string> {
    const burnData = encodeFunctionData({
      abi: tokenAbi,
      functionName: 'burn',
      args: [amount],
    })

    let gasLimit = options?.gasLimit
    if (!gasLimit) {
      gasLimit = await this.publicClient.estimateGas({
        account: this.account,
        to: token,
        data: burnData,
      })
    }

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: token,
      data: burnData,
      gas: gasLimit,
      chain: CURRENT_CHAIN,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
  }

  /**
   * Burn tokens from another account (requires allowance)
   */
  async burnFrom(
    token: Address,
    account: Address,
    amount: bigint,
    options?: { gasLimit?: bigint }
  ): Promise<string> {
    const burnFromData = encodeFunctionData({
      abi: tokenAbi,
      functionName: 'burnFrom',
      args: [account, amount],
    })

    let gasLimit = options?.gasLimit
    if (!gasLimit) {
      gasLimit = await this.publicClient.estimateGas({
        account: this.account,
        to: token,
        data: burnFromData,
      })
    }

    const tx = await this.walletClient.sendTransaction({
      account: this.account,
      to: token,
      data: burnFromData,
      gas: gasLimit,
      chain: CURRENT_CHAIN,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx })
    return receipt.transactionHash
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: Address): Promise<boolean> {
    try {
      const code = await this.publicClient.getCode({ address })
      return code !== undefined && code !== '0x'
    } catch {
      return false
    }
  }

  /**
   * Batch get balances for multiple tokens
   * Efficient for portfolio tracking
   */
  async batchGetBalances(tokens: Address[], address?: Address): Promise<Record<string, bigint>> {
    const addr = address || this.account.address

    const contracts = tokens.map(token => ({
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [addr],
    }))

    const results = await this.publicClient.multicall({ contracts })

    const balances: Record<string, bigint> = {}
    tokens.forEach((token, i) => {
      const result = results[i]
      balances[token.toLowerCase()] = result.status === 'success' ? result.result : BigInt(0)
    })

    return balances
  }

  /**
   * Batch get metadata for multiple tokens
   * Efficient for token discovery
   */
  async batchGetMetadata(tokens: Address[]): Promise<Record<string, TokenMetadata>> {
    const contracts = tokens.flatMap(token => [
      { address: token, abi: erc20Abi, functionName: 'name' as const },
      { address: token, abi: erc20Abi, functionName: 'symbol' as const },
      { address: token, abi: erc20Abi, functionName: 'decimals' as const },
      { address: token, abi: erc20Abi, functionName: 'totalSupply' as const },
    ])

    const results = await this.publicClient.multicall({ contracts })

    const metadata: Record<string, TokenMetadata> = {}

    tokens.forEach((token, i) => {
      const baseIndex = i * 4
      const name = results[baseIndex]
      const symbol = results[baseIndex + 1]
      const decimals = results[baseIndex + 2]
      const totalSupply = results[baseIndex + 3]

      metadata[token.toLowerCase()] = {
        name: name.status === 'success' ? (name.result as string) : 'Unknown',
        symbol: symbol.status === 'success' ? (symbol.result as string) : 'UNKNOWN',
        decimals: decimals.status === 'success' ? Number(decimals.result) : 18,
        totalSupply: totalSupply.status === 'success' ? (totalSupply.result as bigint) : BigInt(0),
        address: token,
      }
    })

    return metadata
  }

  /**
   * Get multiple allowances in one call
   * Useful for checking multiple spenders
   */
  async batchGetAllowances(
    token: Address,
    spenders: Address[],
    owner?: Address
  ): Promise<Record<string, bigint>> {
    const ownerAddr = owner || this.account.address

    const contracts = spenders.map(spender => ({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance' as const,
      args: [ownerAddr, spender],
    }))

    const results = await this.publicClient.multicall({ contracts })

    const allowances: Record<string, bigint> = {}
    spenders.forEach((spender, i) => {
      const result = results[i]
      allowances[spender.toLowerCase()] = result.status === 'success' ? result.result : BigInt(0)
    })

    return allowances
  }

  /**
   * Approve multiple spenders in batch
   * Returns array of transaction hashes
   */
  async batchApprove(
    token: Address,
    spenders: Address[],
    amounts: bigint[],
    options?: { gasLimit?: bigint }
  ): Promise<string[]> {
    if (spenders.length !== amounts.length) {
      throw new Error('Spenders and amounts arrays must have the same length')
    }

    const txHashes: string[] = []

    for (let i = 0; i < spenders.length; i++) {
      const txHash = await this.approve(token, spenders[i], amounts[i], options)
      txHashes.push(txHash)
    }

    return txHashes
  }

  /**
   * Check token health/validity
   * Returns comprehensive token status including new features
   */
  async getTokenHealth(token: Address): Promise<{
    isContract: boolean
    hasBasicFunctions: boolean
    metadata: TokenMetadata | null
    error?: string
  }> {
    try {
      const isContract = await this.isContract(token)
      if (!isContract) {
        return {
          isContract: false,
          hasBasicFunctions: false,
          metadata: null,
          error: 'Address is not a contract',
        }
      }

      // Parallel checks for performance
      const metadataResult = await this.getMetadata(token)

      const hasBasicFunctions = true
      const metadata = metadataResult

      return {
        isContract: true,
        hasBasicFunctions,
        metadata,
      }
    } catch (error: any) {
      return {
        isContract: false,
        hasBasicFunctions: false,
        metadata: null,
        error: error.message,
      }
    }
  }

  get address(): string {
    return this.account.address
  }
}
