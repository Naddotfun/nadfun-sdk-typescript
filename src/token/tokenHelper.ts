import type { Address, PublicClient, WalletClient, PrivateKeyAccount, Hex } from 'viem'
import { createPublicClient, createWalletClient, http, erc20Abi, formatUnits, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAINS, CONTRACTS, API_BASE_URL, DEFAULT_NETWORK, type Network } from '../common/constants'
import { tokenAbi } from '../abis/token'
import { curveAbi } from '../abis/curve'
import { lensAbi } from '../abis/lens'
import { bondingCurveRouterAbi } from '../abis/router'

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

// ==================== Token Create Types ====================

export interface UploadImageResult {
  imageUri: string
  isNsfw: boolean
}

export interface UploadMetadataParams {
  imageUri: string
  name: string
  symbol: string
  description: string
  website?: string
  twitter?: string
  telegram?: string
}

export interface UploadMetadataResult {
  metadataUri: string
  metadata: {
    name: string
    symbol: string
    description: string
    imageUri: string
    website?: string
    twitter?: string
    telegram?: string
    isNsfw: boolean
  }
}

export interface MineSaltParams {
  creator: Address
  name: string
  symbol: string
  metadataUri: string
}

export interface MineSaltResult {
  salt: `0x${string}`
  address: Address
}

export interface CreateTokenParams {
  name: string
  symbol: string
  description: string
  image: Buffer | Blob | File
  imageContentType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml'
  website?: string
  twitter?: string
  telegram?: string
  initialBuyAmount?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

export interface CreateTokenResult {
  tokenAddress: Address
  poolAddress: Address
  transactionHash: Hex
  imageUri: string
  metadataUri: string
  salt: `0x${string}`
  isNsfw: boolean
}

export interface FeeConfig {
  deployFeeAmount: bigint
  graduateFeeAmount: bigint
  protocolFee: number
}

export interface TokenHelper {
  readonly publicClient: PublicClient
  readonly walletClient: WalletClient
  readonly account: PrivateKeyAccount
  readonly address: Address

  // ERC-20 Read
  getBalance: (token: Address, address?: Address) => Promise<bigint>
  getBalanceFormatted: (token: Address, address?: Address) => Promise<[bigint, string]>
  getAllowance: (token: Address, spender: Address, owner?: Address) => Promise<bigint>
  getMetadata: (token: Address) => Promise<TokenMetadata>
  getDecimals: (token: Address) => Promise<number>
  getName: (token: Address) => Promise<string>
  getSymbol: (token: Address) => Promise<string>
  getTotalSupply: (token: Address) => Promise<bigint>
  getNonce: (token: Address, owner?: Address) => Promise<bigint>

  // ERC-20 Write
  approve: (token: Address, spender: Address, amount: bigint, options?: { gasLimit?: bigint }) => Promise<Hex>
  transfer: (token: Address, to: Address, amount: bigint, options?: { gasLimit?: bigint }) => Promise<Hex>

  // ERC-2612 Permit
  generatePermitSignature: (token: Address, spender: Address, value: bigint, deadline: bigint, owner?: Address) => Promise<PermitSignature>

  // Utilities
  isContract: (address: Address) => Promise<boolean>
  batchGetBalances: (tokens: Address[], address?: Address) => Promise<Record<string, bigint>>
  batchGetMetadata: (tokens: Address[]) => Promise<Record<string, TokenMetadata>>

  // Token Creation API
  uploadImage: (image: Buffer | Blob | File, contentType: string) => Promise<UploadImageResult>
  uploadMetadata: (params: UploadMetadataParams) => Promise<UploadMetadataResult>
  mineSalt: (params: MineSaltParams) => Promise<MineSaltResult>

  // Token Creation Contract
  getFeeConfig: () => Promise<FeeConfig>
  getInitialBuyAmountOut: (amountIn: bigint) => Promise<bigint>
  createToken: (params: CreateTokenParams) => Promise<CreateTokenResult>
}

// ==================== Factory ====================

export function createTokenHelper(config: TokenHelperConfig): TokenHelper {
  const network = config.network ?? DEFAULT_NETWORK
  const chain = CHAINS[network]
  const contracts = CONTRACTS[network]
  const apiBaseUrl = API_BASE_URL[network]

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

    // ==================== Token Creation API ====================

    async uploadImage(image, contentType) {
      const response = await fetch(`${apiBaseUrl}/metadata/image`, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: image,
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: 'Unknown error' }))) as { error?: string }
        throw new Error(`Image upload failed: ${error.error || response.statusText}`)
      }

      const data = (await response.json()) as { image_uri: string; is_nsfw: boolean }
      return {
        imageUri: data.image_uri,
        isNsfw: data.is_nsfw,
      }
    },

    async uploadMetadata(params) {
      const response = await fetch(`${apiBaseUrl}/metadata/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_uri: params.imageUri,
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          website: params.website ?? null,
          twitter: params.twitter ?? null,
          telegram: params.telegram ?? null,
        }),
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: 'Unknown error' }))) as { error?: string }
        throw new Error(`Metadata upload failed: ${error.error || response.statusText}`)
      }

      const data = (await response.json()) as {
        metadata_uri: string
        metadata: {
          name: string
          symbol: string
          description: string
          image_uri: string
          website?: string
          twitter?: string
          telegram?: string
          is_nsfw: boolean
        }
      }
      return {
        metadataUri: data.metadata_uri,
        metadata: {
          name: data.metadata.name,
          symbol: data.metadata.symbol,
          description: data.metadata.description,
          imageUri: data.metadata.image_uri,
          website: data.metadata.website,
          twitter: data.metadata.twitter,
          telegram: data.metadata.telegram,
          isNsfw: data.metadata.is_nsfw,
        },
      }
    },

    async mineSalt(params) {
      const response = await fetch(`${apiBaseUrl}/token/salt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: params.creator,
          name: params.name,
          symbol: params.symbol,
          metadata_uri: params.metadataUri,
        }),
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: 'Unknown error' }))) as { error?: string }
        throw new Error(`Salt mining failed: ${error.error || response.statusText}`)
      }

      const data = (await response.json()) as { salt: string; address: string }
      return {
        salt: data.salt as `0x${string}`,
        address: data.address as Address,
      }
    },

    // ==================== Token Creation Contract ====================

    async getFeeConfig() {
      const result = await publicClient.readContract({
        address: contracts.CURVE,
        abi: curveAbi,
        functionName: 'feeConfig',
      })
      return {
        deployFeeAmount: result[0],
        graduateFeeAmount: result[1],
        protocolFee: result[2],
      }
    },

    async getInitialBuyAmountOut(amountIn) {
      return publicClient.readContract({
        address: contracts.LENS,
        abi: lensAbi,
        functionName: 'getInitialBuyAmountOut',
        args: [amountIn],
      })
    },

    async createToken(params) {
      // Step 1: Upload image
      const imageResult = await this.uploadImage(params.image, params.imageContentType)

      // Step 2: Upload metadata
      const metadataResult = await this.uploadMetadata({
        imageUri: imageResult.imageUri,
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
      })

      // Step 3: Mine salt for vanity address
      const saltResult = await this.mineSalt({
        creator: account.address,
        name: params.name,
        symbol: params.symbol,
        metadataUri: metadataResult.metadataUri,
      })

      // Step 4: Get deploy fee
      const feeConfig = await this.getFeeConfig()

      // Step 5: Calculate total value and expected tokens
      const initialBuyAmount = params.initialBuyAmount ?? 0n
      const totalValue = feeConfig.deployFeeAmount + initialBuyAmount

      // Step 6: Calculate minimum tokens for initial buy
      let minTokens = 0n
      if (initialBuyAmount > 0n) {
        minTokens = await this.getInitialBuyAmountOut(initialBuyAmount)
      }

      // Step 7: Create token on-chain via BONDING_CURVE_ROUTER
      const hash = await walletClient.writeContract({
        address: contracts.BONDING_CURVE_ROUTER,
        abi: bondingCurveRouterAbi,
        functionName: 'create',
        args: [
          {
            name: params.name,
            symbol: params.symbol,
            tokenURI: metadataResult.metadataUri,
            amountOut: minTokens,
            salt: saltResult.salt,
            actionId: 1,
          },
        ],
        account,
        chain,
        value: totalValue,
        gas: params.gasLimit,
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      })

      // Step 8: Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Step 9: Parse CurveCreate event to get token and pool addresses
      let tokenAddress: Address = saltResult.address
      let poolAddress: Address = '0x0000000000000000000000000000000000000000'

      for (const log of receipt.logs) {
        try {
          const event = decodeEventLog({
            abi: curveAbi,
            data: log.data,
            topics: log.topics,
          })
          if (event.eventName === 'CurveCreate') {
            tokenAddress = event.args.token as Address
            poolAddress = event.args.pool as Address
            break
          }
        } catch {
          // Not a CurveCreate event, continue
        }
      }

      return {
        tokenAddress,
        poolAddress,
        transactionHash: receipt.transactionHash,
        imageUri: imageResult.imageUri,
        metadataUri: metadataResult.metadataUri,
        salt: saltResult.salt,
        isNsfw: imageResult.isNsfw,
      }
    },
  }
}
