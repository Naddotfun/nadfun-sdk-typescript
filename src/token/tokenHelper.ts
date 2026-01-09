import type { Address, PublicClient, WalletClient, PrivateKeyAccount, Hex } from 'viem'
import { createPublicClient, createWalletClient, http, erc20Abi, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAINS, DEFAULT_NETWORK, type Network } from '../common/constants'
import { tokenAbi } from '../abis/token'

// ==================== Types ====================

export interface TokenHelperConfig {
  rpcUrl: string
  privateKey: `0x${string}`
  network?: Network
}

export interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: Address
}

export interface PermitSignature {
  v: 27 | 28
  r: `0x${string}`
  s: `0x${string}`
  nonce: bigint
}

export interface TokenHelper {
  readonly publicClient: PublicClient
  readonly walletClient: WalletClient
  readonly account: PrivateKeyAccount
  readonly address: Address

  getBalance: (token: Address, address?: Address) => Promise<bigint>
  getBalanceFormatted: (token: Address, address?: Address) => Promise<[bigint, string]>
  getAllowance: (token: Address, spender: Address, owner?: Address) => Promise<bigint>
  getMetadata: (token: Address) => Promise<TokenMetadata>
  getDecimals: (token: Address) => Promise<number>
  getName: (token: Address) => Promise<string>
  getSymbol: (token: Address) => Promise<string>
  getTotalSupply: (token: Address) => Promise<bigint>
  getNonce: (token: Address, owner?: Address) => Promise<bigint>

  approve: (token: Address, spender: Address, amount: bigint, options?: { gasLimit?: bigint }) => Promise<Hex>
  transfer: (token: Address, to: Address, amount: bigint, options?: { gasLimit?: bigint }) => Promise<Hex>

  generatePermitSignature: (token: Address, spender: Address, value: bigint, deadline: bigint, owner?: Address) => Promise<PermitSignature>

  isContract: (address: Address) => Promise<boolean>

  batchGetBalances: (tokens: Address[], address?: Address) => Promise<Record<string, bigint>>
  batchGetMetadata: (tokens: Address[]) => Promise<Record<string, TokenMetadata>>
}

// ==================== Factory ====================

export function createTokenHelper(config: TokenHelperConfig): TokenHelper {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]

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
    address: account.address,

    async getBalance(token, address) {
      return publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address ?? account.address],
      })
    },

    async getBalanceFormatted(token, address) {
      const [balance, decimals] = await publicClient.multicall({
        contracts: [
          { address: token, abi: erc20Abi, functionName: 'balanceOf', args: [address ?? account.address] },
          { address: token, abi: erc20Abi, functionName: 'decimals' },
        ],
      })
      const balanceValue = balance.status === 'success' ? balance.result : 0n
      const decimalsValue = decimals.status === 'success' ? decimals.result : 18
      return [balanceValue, formatUnits(balanceValue, decimalsValue)]
    },

    async getAllowance(token, spender, owner) {
      return publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner ?? account.address, spender],
      })
    },

    async getMetadata(token) {
      const [name, symbol, decimals, totalSupply] = await publicClient.multicall({
        contracts: [
          { address: token, abi: erc20Abi, functionName: 'name' },
          { address: token, abi: erc20Abi, functionName: 'symbol' },
          { address: token, abi: erc20Abi, functionName: 'decimals' },
          { address: token, abi: erc20Abi, functionName: 'totalSupply' },
        ],
      })
      return {
        name: name.status === 'success' ? name.result : 'Unknown',
        symbol: symbol.status === 'success' ? symbol.result : 'UNKNOWN',
        decimals: decimals.status === 'success' ? decimals.result : 18,
        totalSupply: totalSupply.status === 'success' ? totalSupply.result : 0n,
        address: token,
      }
    },

    async getDecimals(token) {
      return publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' })
    },

    async getName(token) {
      try {
        return await publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'name' })
      } catch {
        return 'Unknown'
      }
    },

    async getSymbol(token) {
      try {
        return await publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'symbol' })
      } catch {
        return 'UNKNOWN'
      }
    },

    async getTotalSupply(token) {
      return publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'totalSupply' })
    },

    async getNonce(token, owner) {
      return publicClient.readContract({
        address: token,
        abi: tokenAbi,
        functionName: 'nonces',
        args: [owner ?? account.address],
      })
    },

    async approve(token, spender, amount, options) {
      const hash = await walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
        account,
        chain,
        gas: options?.gasLimit,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.transactionHash
    },

    async transfer(token, to, amount, options) {
      const hash = await walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, amount],
        account,
        chain,
        gas: options?.gasLimit,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.transactionHash
    },

    async generatePermitSignature(token, spender, value, deadline, owner) {
      const ownerAddr = owner ?? account.address
      const nonce = await publicClient.readContract({
        address: token,
        abi: tokenAbi,
        functionName: 'nonces',
        args: [ownerAddr],
      })

      let tokenName: string
      try {
        tokenName = await publicClient.readContract({ address: token, abi: erc20Abi, functionName: 'name' })
      } catch {
        tokenName = 'Unknown'
      }

      const signature = await walletClient.signTypedData({
        account,
        domain: {
          name: tokenName,
          version: '1',
          chainId: chain.id,
          verifyingContract: token,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        message: { owner: ownerAddr, spender, value, nonce, deadline },
      })

      const r = `0x${signature.slice(2, 66)}` as `0x${string}`
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`
      const v = parseInt(signature.slice(130, 132), 16) as 27 | 28

      return { v, r, s, nonce }
    },

    async isContract(address) {
      const code = await publicClient.getCode({ address })
      return code !== undefined && code !== '0x'
    },

    async batchGetBalances(tokens, address) {
      const addr = address ?? account.address
      const contracts = tokens.map(token => ({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [addr] as const,
      }))
      const results = await publicClient.multicall({ contracts })
      const balances: Record<string, bigint> = {}
      tokens.forEach((token, i) => {
        balances[token.toLowerCase()] = results[i].status === 'success' ? results[i].result : 0n
      })
      return balances
    },

    async batchGetMetadata(tokens) {
      const contracts = tokens.flatMap(token => [
        { address: token, abi: erc20Abi, functionName: 'name' as const },
        { address: token, abi: erc20Abi, functionName: 'symbol' as const },
        { address: token, abi: erc20Abi, functionName: 'decimals' as const },
        { address: token, abi: erc20Abi, functionName: 'totalSupply' as const },
      ])
      const results = await publicClient.multicall({ contracts })
      const metadata: Record<string, TokenMetadata> = {}
      tokens.forEach((token, i) => {
        const baseIndex = i * 4
        metadata[token.toLowerCase()] = {
          name: results[baseIndex].status === 'success' ? (results[baseIndex].result as string) : 'Unknown',
          symbol: results[baseIndex + 1].status === 'success' ? (results[baseIndex + 1].result as string) : 'UNKNOWN',
          decimals: results[baseIndex + 2].status === 'success' ? Number(results[baseIndex + 2].result) : 18,
          totalSupply: results[baseIndex + 3].status === 'success' ? (results[baseIndex + 3].result as bigint) : 0n,
          address: token,
        }
      })
      return metadata
    },
  }
}
