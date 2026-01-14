# Nad.fun TypeScript SDK

TypeScript SDK for Nad.fun - bonding curve trading, token operations, and real-time event streaming on Monad.

## Installation

```bash
npm install @nadfun/sdk
```

## Quick Start

```typescript
import { initSDK, parseEther } from '@nadfun/sdk'

const nadSDK = initSDK({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY! as `0x${string}`,
  network: 'testnet', // or 'mainnet'
})

// Buy tokens
await nadSDK.simpleBuy({
  token: '0x...',
  amountIn: parseEther('0.1'),
  slippagePercent: 1,
})

// Sell tokens (automatic approve)
await nadSDK.simpleSell({
  token: '0x...',
  amountIn: parseEther('1000'),
  slippagePercent: 1,
})
```

## Project Structure

```
src/
├── index.ts              # Main exports
├── core.ts               # SDK factory (initSDK, NadFunSDK)
├── common/
│   ├── constants.ts      # Network contracts & chain configs
│   └── utils.ts          # Utility functions
├── trading/
│   └── trading.ts        # Trading operations (buy, sell, quote)
├── token/
│   └── tokenHelper.ts    # ERC20 token operations
├── stream/
│   ├── curve.ts          # Real-time curve event streaming
│   └── dex.ts            # Real-time DEX swap streaming
├── indexer/
│   ├── curve.ts          # Historical curve event indexing
│   └── dex.ts            # Historical DEX swap indexing
└── abis/                 # Contract ABIs
    ├── curve.ts
    ├── router.ts
    ├── lens.ts
    ├── token.ts
    ├── v3factory.ts
    └── v3pool.ts
```

## Features

### Trading

```typescript
// Simple buy
await nadSDK.simpleBuy({
  token: '0x...',
  amountIn: parseEther('0.1'),
  slippagePercent: 1,
})

// Simple sell (automatic approve)
await nadSDK.simpleSell({
  token: '0x...',
  amountIn: parseEther('1000'),
  slippagePercent: 1,
})

// Get quote
const quote = await nadSDK.getAmountOut(token, amountIn, true) // true = buy
console.log('Router:', quote.router)
console.log('Expected amount:', quote.amount)

// Low-level buy (manual control)
await nadSDK.buy({
  token,
  amountIn,
  amountOutMin,
  to: nadSDK.account.address,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
}, router)

// Sell with permit (gasless approve)
const permit = await nadSDK.generatePermitSignature(token, router, amountIn, deadline)
await nadSDK.sellPermit({
  token,
  amountIn,
  amountOutMin,
  to: nadSDK.account.address,
  deadline,
  amountAllowance: amountIn,
  ...permit,
}, router)

// Gas estimation
const gas = await nadSDK.estimateGas(router, {
  type: 'buy',
  token,
  amountIn,
  amountOutMin,
  to: nadSDK.account.address,
})
```

### Token Operations

```typescript
// Balance
const balance = await nadSDK.getBalance(token)
const [raw, formatted] = await nadSDK.getBalanceFormatted(token)

// Batch balances
const balances = await nadSDK.batchGetBalances([token1, token2, token3])

// Metadata
const metadata = await nadSDK.getMetadata(token)
console.log(`${metadata.name} (${metadata.symbol})`)

// Batch metadata
const allMetadata = await nadSDK.batchGetMetadata([token1, token2])

// Individual metadata methods
const decimals = await nadSDK.getDecimals(token)
const name = await nadSDK.getName(token)
const symbol = await nadSDK.getSymbol(token)
const totalSupply = await nadSDK.getTotalSupply(token)
const nonce = await nadSDK.getNonce(token)

// Approve
await nadSDK.approve(token, spender, amount)

// Transfer
await nadSDK.transfer(token, to, amount)

// Allowance
const allowance = await nadSDK.getAllowance(token, spender)

// Check if address is contract
const isContract = await nadSDK.isContract(address)

// Permit signature (EIP-2612)
const permit = await nadSDK.generatePermitSignature(token, spender, amount, deadline)
```

### Token Creation

```typescript
import { initSDK, parseEther, formatEther } from '@nadfun/sdk'
import * as fs from 'fs'

const nadSDK = initSDK({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY! as `0x${string}`,
  network: 'testnet',
})

// Get deploy fee
const feeConfig = await nadSDK.getFeeConfig()
console.log('Deploy fee:', formatEther(feeConfig.deployFeeAmount), 'MON')

// Calculate expected tokens for initial buy
const initialBuyAmount = parseEther('0.1')
const expectedTokens = await nadSDK.getInitialBuyAmountOut(initialBuyAmount)
console.log('Expected tokens:', formatEther(expectedTokens))

// Create token with initial buy
const imageBuffer = fs.readFileSync('./my-token.png')
const result = await nadSDK.createToken({
  name: 'My Token',
  symbol: 'MTK',
  description: 'A token created with NadFun SDK',
  image: imageBuffer,
  imageContentType: 'image/png',
  website: 'https://mytoken.com',
  twitter: 'https://x.com/mytoken',
  telegram: 'https://t.me/mytoken',
  initialBuyAmount,
})

console.log('Token Address:', result.tokenAddress)
console.log('Pool Address:', result.poolAddress)
console.log('TX Hash:', result.transactionHash)
```

Individual API calls for advanced usage:

```typescript
// Step 1: Upload image
const imageResult = await nadSDK.uploadImage(imageBuffer, 'image/png')
console.log('Image URI:', imageResult.imageUri)
console.log('Is NSFW:', imageResult.isNsfw)

// Step 2: Upload metadata
const metadataResult = await nadSDK.uploadMetadata({
  imageUri: imageResult.imageUri,
  name: 'My Token',
  symbol: 'MTK',
  description: 'A token created with NadFun SDK',
  website: 'https://mytoken.com',
})
console.log('Metadata URI:', metadataResult.metadataUri)

// Step 3: Mine salt for vanity address
const saltResult = await nadSDK.mineSalt({
  creator: nadSDK.account.address,
  name: 'My Token',
  symbol: 'MTK',
  metadataUri: metadataResult.metadataUri,
})
console.log('Salt:', saltResult.salt)
console.log('Predicted Address:', saltResult.address)
```

### Curve State

```typescript
// Bonding curve state
const state = await nadSDK.getCurveState(token)
console.log('Real MON Reserve:', state.realMonReserve)
console.log('Real Token Reserve:', state.realTokenReserve)
console.log('Virtual MON Reserve:', state.virtualMonReserve)
console.log('Virtual Token Reserve:', state.virtualTokenReserve)
console.log('K:', state.k)
console.log('Target Token Amount:', state.targetTokenAmount)

// Available tokens to buy before graduation
const available = await nadSDK.getAvailableBuyTokens(token)
console.log('Available:', available.availableBuyToken)
console.log('Required MON:', available.requiredMonAmount)

// Progress (0-10000 = 0-100%)
const progress = await nadSDK.getProgress(token)
console.log(`Progress: ${Number(progress) / 100}%`)

// Graduation status
const isGraduated = await nadSDK.isGraduated(token)
const isLocked = await nadSDK.isLocked(token)

// Calculate initial buy amount
const amountOut = await nadSDK.getInitialBuyAmountOut(parseEther('1'))
```

### Real-time Streaming

> **Note:** `wsUrl` must be provided in `initSDK` config to use streaming features.

```typescript
const nadSDK = initSDK({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY! as `0x${string}`,
  network: 'testnet',
  wsUrl: process.env.WS_URL!, // Required for streaming
})

// Curve events - with initial filter options
const stream = nadSDK.createCurveStream({
  tokens: [tokenAddress],
  eventTypes: ['Create', 'Buy', 'Sell'],
})

stream.onEvent((event) => {
  console.log(`[${event.type}]`, event)
})

stream.onError((error) => {
  console.error('Stream error:', error)
})

stream.start()

// Or set filters after creation
stream.filterEventTypes(['Buy', 'Sell'])
stream.filterTokens([tokenAddress])
stream.clearFilters()

// Stop streaming
stream.stop()

// DEX swaps
const dexStream = nadSDK.createDexStream([poolAddress])
dexStream.onSwap((event) => {
  console.log('Swap:', event)
})
dexStream.start()
```

### Pool Discovery

```typescript
import { discoverPoolForToken, discoverPoolsForTokens, createDexStreamWithTokens } from '@nadfun/sdk'

// Find pool for a single token
const pool = await discoverPoolForToken(rpcUrl, tokenAddress, 'testnet')

// Find pools for multiple tokens
const pools = await discoverPoolsForTokens(rpcUrl, [token1, token2], 'testnet')

// Create DEX stream with automatic pool discovery
const stream = await createDexStreamWithTokens(wsUrl, rpcUrl, [token1, token2], 'testnet')
stream.onSwap((event) => console.log(event))
stream.start()
```

### Historical Indexing

```typescript
// Curve indexer
const indexer = nadSDK.createCurveIndexer()

// Get all events with filters
const events = await indexer.getEvents({
  fromBlock: 1000000n,
  toBlock: 1001000n,
  eventTypes: ['Buy', 'Sell'],
  tokens: [tokenAddress],
})

// Specific event types
const creates = await indexer.getCreateEvents(fromBlock, toBlock)
const buys = await indexer.getBuyEvents(fromBlock, toBlock, tokenAddress)
const sells = await indexer.getSellEvents(fromBlock, toBlock, tokenAddress)
const syncs = await indexer.getSyncEvents(fromBlock, toBlock, tokenAddress)
const locks = await indexer.getTokenLockedEvents(fromBlock, toBlock)
const graduates = await indexer.getGraduateEvents(fromBlock, toBlock)

// Get latest block
const latestBlock = await indexer.getLatestBlock()

// DEX indexer
const dexIndexer = nadSDK.createDexIndexer([poolAddress])

const swaps = await dexIndexer.getSwapEvents({
  fromBlock: 1000000n,
  toBlock: 1001000n,
  sender: senderAddress,     // optional
  recipient: recipientAddress, // optional
})

// Pool info
const poolInfo = await dexIndexer.getPoolInfo(poolAddress)
const allPoolsInfo = await dexIndexer.getPoolsInfo()
```

## Network Configuration

```typescript
const nadSDK = initSDK({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY! as `0x${string}`,
  network: 'testnet', // 'testnet' | 'mainnet'
})

// Access network constants
import { CONTRACTS, CHAINS, DEFAULT_NETWORK, NADS_FEE_TIER } from '@nadfun/sdk'

console.log(CONTRACTS.testnet.CURVE)
console.log(CHAINS.mainnet.id) // 143
```

## Utility Functions

```typescript
import {
  calculateMinAmountOut,
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
} from '@nadfun/sdk'

// Slippage calculation
const minOut = calculateMinAmountOut(expectedAmount, 0.5) // 0.5% slippage
```

## Examples

```bash
# Copy .env.example to .env and configure
cp .env.example .env

# Run examples
npx tsx -r dotenv/config examples/simple-buy.ts
npx tsx -r dotenv/config examples/simple-sell.ts
npx tsx -r dotenv/config examples/buy.ts
npx tsx -r dotenv/config examples/sell.ts
npx tsx -r dotenv/config examples/sell-permit.ts
npx tsx -r dotenv/config examples/token.ts
npx tsx -r dotenv/config examples/curve-stream.ts
npx tsx -r dotenv/config examples/curve-indexer.ts
npx tsx -r dotenv/config examples/dex-stream.ts
npx tsx -r dotenv/config examples/dex-indexer.ts
npx tsx -r dotenv/config examples/create-token.ts
```

## API Reference

### initSDK(config)

Creates SDK instance with all methods.

```typescript
interface SDKConfig {
  rpcUrl: string
  privateKey: `0x${string}`
  network?: 'testnet' | 'mainnet' // default: 'testnet'
  wsUrl?: string // Required for streaming features
}
```

### Trading Methods

| Method | Description |
|--------|-------------|
| `simpleBuy(params)` | Buy with auto slippage |
| `simpleSell(params)` | Sell with auto approve + slippage |
| `buy(params, router)` | Low-level buy |
| `sell(params, router)` | Low-level sell |
| `sellPermit(params, router)` | Sell with permit (gasless approve) |
| `getAmountOut(token, amountIn, isBuy)` | Get quote |
| `getAmountIn(token, amountOut, isBuy)` | Get required input |
| `estimateGas(router, params)` | Estimate gas for trade |

### Token Methods

| Method | Description |
|--------|-------------|
| `getBalance(token, address?)` | Get token balance |
| `getBalanceFormatted(token, address?)` | Get balance with formatted string |
| `approve(token, spender, amount)` | Approve spender |
| `transfer(token, to, amount)` | Transfer tokens |
| `getMetadata(token)` | Get token metadata |
| `getDecimals(token)` | Get token decimals |
| `getName(token)` | Get token name |
| `getSymbol(token)` | Get token symbol |
| `getTotalSupply(token)` | Get total supply |
| `getNonce(token, owner?)` | Get permit nonce |
| `getAllowance(token, spender, owner?)` | Get allowance |
| `isContract(address)` | Check if address is contract |
| `generatePermitSignature(...)` | Generate EIP-2612 permit |
| `batchGetBalances(tokens, address?)` | Get multiple balances |
| `batchGetMetadata(tokens)` | Get multiple token metadata |

### Curve Methods

| Method | Description |
|--------|-------------|
| `getCurveState(token)` | Get bonding curve state |
| `getAvailableBuyTokens(token)` | Get available tokens to buy |
| `getProgress(token)` | Get graduation progress (0-10000) |
| `isGraduated(token)` | Check if graduated |
| `isLocked(token)` | Check if locked |
| `getInitialBuyAmountOut(amountIn)` | Calculate initial buy amount |

### Stream Factories

| Method | Description |
|--------|-------------|
| `createCurveStream(options?)` | Create curve event stream (requires wsUrl in config) |
| `createCurveIndexer()` | Create curve indexer |
| `createDexStream(pools)` | Create DEX stream (requires wsUrl in config) |
| `createDexIndexer(pools)` | Create DEX indexer |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `discoverPoolForToken(rpcUrl, token, network?)` | Find V3 pool for token |
| `discoverPoolsForTokens(rpcUrl, tokens, network?)` | Find V3 pools for tokens |
| `createDexStreamWithTokens(wsUrl, rpcUrl, tokens, network?)` | Create DEX stream with auto pool discovery |
| `createDexIndexerWithTokens(rpcUrl, tokens, network?)` | Create DEX indexer with auto pool discovery |
| `calculateMinAmountOut(amount, slippagePercent)` | Calculate min output with slippage |

### Types

```typescript
// Network
type Network = 'testnet' | 'mainnet'

// Trading
interface SimpleBuyParams {
  token: Address
  amountIn: bigint
  slippagePercent?: number
  to?: Address
  deadline?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

interface SimpleSellParams {
  token: Address
  amountIn: bigint
  slippagePercent?: number
  to?: Address
  deadline?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
  nonce?: number
}

interface QuoteResult {
  router: Address
  amount: bigint
}

// Curve
interface CurveState {
  realMonReserve: bigint
  realTokenReserve: bigint
  virtualMonReserve: bigint
  virtualTokenReserve: bigint
  k: bigint
  targetTokenAmount: bigint
  initVirtualMonReserve: bigint
  initVirtualTokenReserve: bigint
}

interface AvailableBuyTokens {
  availableBuyToken: bigint
  requiredMonAmount: bigint
}

// Token
interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: Address
}

interface PermitSignature {
  v: 27 | 28
  r: `0x${string}`
  s: `0x${string}`
  nonce: bigint
}

// Events
type CurveEventType = 'Create' | 'Buy' | 'Sell' | 'Sync' | 'TokenLocked' | 'Graduate'

interface SwapEvent {
  pool: Address
  sender: Address
  recipient: Address
  amount0: bigint
  amount1: bigint
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
  blockNumber: bigint
  transactionHash: `0x${string}`
  logIndex: number
}

interface PoolInfo {
  address: Address
  token0: Address
  token1: Address
  fee: number
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
}
```

## Contract Addresses

### Testnet (Monad Testnet)

| Contract | Address |
|----------|---------|
| DEX Router | `0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2` |
| Bonding Curve Router | `0x865054F0F6A288adaAc30261731361EA7E908003` |
| Lens | `0xB056d79CA5257589692699a46623F901a3BB76f1` |
| Curve | `0x1228b0dc9481C11D3071E7A924B794CfB038994e` |
| WMON | `0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd` |
| V3 Factory | `0xd0a37cf728CE2902eB8d4F6f2afc76854048253b` |

### Mainnet (Monad Mainnet, Chain ID: 143)

| Contract | Address |
|----------|---------|
| DEX Router | `0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137` |
| Bonding Curve Router | `0x6F6B8F1a20703309951a5127c45B49b1CD981A22` |
| Lens | `0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea` |
| Curve | `0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE` |
| WMON | `0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A` |
| V3 Factory | `0x6B5F564339DbAD6b780249827f2198a841FEB7F3` |

## License

MIT
