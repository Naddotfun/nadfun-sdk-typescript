# Nad.fun TypeScript SDK

A comprehensive TypeScript SDK for interacting with Nad.fun ecosystem contracts, including bonding curves, DEX trading, and real-time event monitoring.

## 📋 Quick Navigation

| 🚀 Getting Started                        | 📊 Features                                           | 💼 Examples                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| [Installation](#installation)             | [Batch Operations](#-batch-operations)                | [Trading Examples](#trading-examples)            |
| [Quick Start](#quick-start)               | [Trading](#-trading)                                  | [Token Examples](#token-examples)                |
| [Configuration](#configuration)           | [Token Operations](#-token-operations)                | [Stream Examples](#stream-examples)              |
| [Contract Addresses](#contract-addresses) | [Slippage Management](#-advanced-slippage-management) | [Testing & Verification](#testing--verification) |

| 📚 Documentation                                | 🔧 Advanced                                        | 🎯 Quick Commands              |
| ----------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| [Core Types](#core-types)                       | [Real-time Streaming](#-real-time-event-streaming) | `bun run example:buy`          |
| [Error Handling](#error-handling)               | [Historical Data](#-historical-data-analysis)      | `bun run example:sell-permit`  |
| [CLI Arguments](#cli-arguments)                 | [Pool Discovery](#-pool-discovery)                 | `bun run example:token-utils`  |
| [Environment Variables](#environment-variables) | [DEX Monitoring](#-dex-monitoring)                 | `bun run example:curve-stream` |

### ⚡ Try It Now

```bash
# Install and setup
bun add @nadfun/sdk
cp env.example .env  # Edit with your keys

# Quick test commands
bun run example:buy -- --token 0xYourTokenAddress
bun run example:token-utils -- --tokens 0xToken1,0xToken2
```

## Installation

```bash
bun add @nadfun/sdk
# or
npm install @nadfun/sdk
# or
yarn add @nadfun/sdk
# or
pnpm add @nadfun/sdk
```

## Quick Start

```typescript
import { Trade, Token, parseEther, formatUnits } from '@nadfun/sdk'

const main = async () => {
  const rpcUrl = 'https://your-rpc-endpoint'
  const privateKey = 'your_private_key_here'
  const tokenAddress = '0x...' as `0x${string}`

  // Trading
  const trade = new Trade(rpcUrl, privateKey)
  const quote = await trade.getAmountOut(tokenAddress, parseEther('0.1'), true)
  console.log(`Quote: ${formatUnits(quote.amount, 18)} tokens`)

  // Buy tokens
  const buyParams = {
    token: tokenAddress,
    to: trade.address,
    amountIn: parseEther('0.1'),
    amountOutMin: quote.amount,
  }
  const txHash = await trade.buy(buyParams, quote.router)
  console.log(`Transaction: ${txHash}`)

  // Token operations
  const token = new Token(rpcUrl, privateKey)
  const metadata = await token.getMetadata(tokenAddress)
  const balance = await token.getBalance(tokenAddress)

  console.log(`Token: ${metadata.name} (${metadata.symbol})`)
  console.log(`Balance: ${formatUnits(balance, metadata.decimals)}`)
}

main().catch(console.error)
```

## Features

### ⚡ Batch Operations

Efficiently manage multiple tokens with optimized batch calls:

```typescript
import { Token } from '@nadfun/sdk'

const token = new Token(rpcUrl, privateKey)
const tokens = ['0x...', '0x...', '0x...']

// Batch fetch metadata and balances
const metadata = await token.batchGetMetadata(tokens)
const balances = await token.batchGetBalances(tokens)

// Batch allowance checks
const allowances = await token.batchGetAllowances(tokens[0], [router1, router2])

// Results are automatically organized by address
Object.entries(metadata).forEach(([address, meta]) => {
  const balance = balances[address]
  console.log(`${meta.symbol}: ${formatUnits(balance, meta.decimals)}`)
})
```

### 🚀 Trading

Execute buy/sell operations with automatic router detection:

```typescript
import { Trade, parseEther, formatUnits } from '@nadfun/sdk'
import { calculateMinAmountOut, SLIPPAGE_PRESETS } from '@nadfun/sdk/utils'

const trade = new Trade(rpcUrl, privateKey)
const tokenAddress = '0x...' as `0x${string}`

// Buy tokens with proper slippage calculation
const quote = await trade.getAmountOut(tokenAddress, parseEther('0.1'), true)
const minTokens = calculateMinAmountOut(quote.amount, 5.0) // 5% slippage

const buyParams = {
  token: tokenAddress,
  to: trade.address,
  amountIn: parseEther('0.1'),
  amountOutMin: minTokens,
}

const txHash = await trade.buy(buyParams, quote.router)
console.log(`Buy transaction: ${txHash}`)

// Sell tokens with permit (gasless)
const sellPermitParams = {
  token: tokenAddress,
  to: trade.address,
  amountIn: parseEther('100'),
  amountOutMin: parseEther('0.05'),
  amountAllowance: parseEther('100'),
  deadline: Math.floor(Date.now() / 1000) + 3600,
}

const sellTx = await trade.sellPermit(sellPermitParams, quote.router)
console.log(`Sell transaction: ${sellTx}`)

// Using slippage presets for different scenarios
const conservativeMin = calculateMinAmountOut(quote.amount, SLIPPAGE_PRESETS.LOW) // 0.5%
const standardMin = calculateMinAmountOut(quote.amount, SLIPPAGE_PRESETS.NORMAL) // 1.0%
const aggressiveMin = calculateMinAmountOut(quote.amount, SLIPPAGE_PRESETS.HIGH) // 3.0%
```

### 📊 Advanced Slippage Management

The SDK provides sophisticated slippage calculation utilities:

```typescript
import {
  calculateMinAmountOut,
  calculateActualSlippage,
  isSlippageWithinTolerance,
  SLIPPAGE_PRESETS,
  getRecommendedSlippage,
} from '@nadfun/sdk/utils'

// Precise slippage calculation (no floating point errors)
const expectedOut = parseEther('100')
const minOut = calculateMinAmountOut(expectedOut, 2.5) // 2.5% slippage

// Get recommended slippage based on token type and trade size
const recommendedSlippage = getRecommendedSlippage(1000, 'minor') // $1000 trade, minor token
const minAmount = calculateMinAmountOut(expectedOut, recommendedSlippage)

// After transaction: verify actual slippage
const actualSlippage = calculateActualSlippage(expectedOut, actualReceived)
const withinTolerance = isSlippageWithinTolerance(expectedOut, actualReceived, 3.0)

console.log(`Actual slippage: ${actualSlippage}%`)
console.log(`Within tolerance: ${withinTolerance}`)
```

**Available Presets:**

- `MINIMAL`: 0.1% (stablecoins)
- `LOW`: 0.5% (major tokens)
- `NORMAL`: 1.0% (standard)
- `HIGH`: 3.0% (illiquid tokens)
- `EMERGENCY`: 10.0% (emergency trades)

### ⛽ Gas Management

The SDK provides intelligent gas management with both real-time estimation and optimized defaults:

#### Default Gas Limits (Recommended)

Based on comprehensive contract testing with 20% safety buffer:

```typescript
import { BONDING_ROUTER_GAS_CONFIG, DEX_ROUTER_GAS_CONFIG } from '@nadfun/sdk'

// Access default gas limits
console.log('Bonding Curve Buy:', BONDING_ROUTER_GAS_CONFIG.BUY) // 320,000n
console.log('Bonding Curve Sell:', BONDING_ROUTER_GAS_CONFIG.SELL) // 170,000n
console.log('DEX Buy:', DEX_ROUTER_GAS_CONFIG.BUY) // 350,000n
console.log('DEX Sell:', DEX_ROUTER_GAS_CONFIG.SELL) // 200,000n

// Use with custom gas config
const customGasConfig = {
  bondingRouter: {
    buy: 350_000n,
    sell: 180_000n,
    sellPermit: 220_000n,
  },
  dexRouter: {
    buy: 400_000n,
    sell: 220_000n,
    sellPermit: 270_000n,
  },
}

const trade = new Trade(rpcUrl, privateKey, customGasConfig)
```

#### Real-time Gas Estimation

```typescript
// Get current network gas price
const gasPrice = await trade.publicClient.getGasPrice()
const recommendedGasPrice = gasPrice * 3n // 3x for better inclusion

// Use in transaction
const txHash = await trade.buy(buyParams, router, {
  gasLimit: 350_000n,
  nonce: await trade.publicClient.getTransactionCount({ address: trade.address }),
})
```

#### Gas Limits Summary

- **Bonding Curve**: Buy: 320k, Sell: 170k, SellPermit: 210k
- **DEX Router**: Buy: 350k, Sell: 200k, SellPermit: 250k
- All limits include 20% safety buffer based on forge test data

### 📊 Token Operations

Interact with ERC-20 tokens with individual and batch operations:

```typescript
import { Token, formatUnits, parseEther } from '@nadfun/sdk'

const token = new Token(rpcUrl, privateKey)

// Individual token operations
const metadata = await token.getMetadata(tokenAddress)
const balance = await token.getBalance(tokenAddress)
const health = await token.getTokenHealth(tokenAddress)

console.log(`${metadata.name} (${metadata.symbol})`)
console.log(`Balance: ${formatUnits(balance, metadata.decimals)}`)
console.log(`Contract: ${health.isContract ? '✅' : '❌'}`)
console.log(`ERC20: ${health.hasBasicFunctions ? '✅' : '❌'}`)
console.log(`Permit: ${health.hasPermit ? '✅' : '❌'}`)

// Batch operations for multiple tokens
const tokens = ['0x...', '0x...', '0x...']
const batchMetadata = await token.batchGetMetadata(tokens)
const batchBalances = await token.batchGetBalances(tokens)

// Check allowances for all tokens
for (const tokenAddr of tokens) {
  const allowances = await token.batchGetAllowances(tokenAddr, [router1, router2])
  console.log(`${tokenAddr} allowances:`, allowances)
}

// Generate permit signature (EIP-2612)
if (health.hasPermit) {
  const deadline = Math.floor(Date.now() / 1000) + 3600
  const signature = await token.generatePermitSignature(
    tokenAddress,
    spender,
    parseEther('100'),
    deadline
  )
  console.log(`Permit signature: nonce ${signature.nonce}`)
}
```

### 🔄 Real-time Event Streaming

Monitor bonding curve and DEX events in real-time:

#### Bonding Curve Streaming

```typescript
import { CurveStream } from '@nadfun/sdk/stream'

// Create WebSocket stream
const curveStream = new CurveStream('wss://your-ws-endpoint')

// Configure filters (optional)
curveStream.filterTokens(['0x...', '0x...'])

// Subscribe and process events
const stream = curveStream.subscribe()

stream.on('event', event => {
  console.log(`Event: ${event.eventType} for token ${event.token}`)
  console.log(`Block: ${event.blockNumber}, Amount: ${event.amount}`)
})

stream.on('error', error => {
  console.error('Stream error:', error)
})

// Start streaming
stream.start()
```

#### DEX Swap Streaming

```typescript
import { DexStream } from '@nadfun/sdk/stream'

// Auto-discover pools for tokens
const dexStream = await DexStream.discoverPoolsForTokens('wss://your-ws-endpoint', [
  '0x...',
  '0x...',
])

// Subscribe and process events
const stream = dexStream.subscribe()

stream.on('event', event => {
  console.log(`Swap in pool ${event.poolAddress}: ${event.amount0} -> ${event.amount1}`)
})

stream.start()
```

### 📈 Historical Data Analysis

Fetch and analyze historical events:

```typescript
import { CurveIndexer } from '@nadfun/sdk/stream'
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http('https://your-rpc-endpoint'),
})

const indexer = new CurveIndexer(publicClient)

// Fetch events from block range (max 100 blocks per request with official RPC)
const events = await indexer.fetchEvents(
  18_000_000,
  18_000_100, // Limited to 100 blocks per request
  ['Create', 'Buy'],
  ['0x...'] // specific tokens
)

console.log(`Found ${events.length} events`)
```

**⚠️ RPC Limitations**: Official Monad RPC has a 100 block range limit per request. For larger ranges, the SDK automatically batches requests.

### 🔍 Pool Discovery

Find Uniswap V3 pool addresses for tokens:

```typescript
import { DexIndexer } from '@nadfun/sdk/stream'

// Auto-discover pools for multiple tokens
const indexer = await DexIndexer.discoverPoolsForTokens(publicClient, tokens)
const pools = indexer.getPoolAddresses()

// Discover pool for single token
const singleIndexer = await DexIndexer.discoverPoolForToken(publicClient, token)
```

### 💱 DEX Monitoring

Monitor Uniswap V3 swap events:

```typescript
import { DexIndexer } from '@nadfun/sdk/stream'

// Auto-discover pools for tokens
const indexer = await DexIndexer.discoverPoolsForTokens(publicClient, tokens)
const swaps = await indexer.fetchEvents(fromBlock, toBlock)

swaps.forEach(swap => {
  console.log(`Swap in pool ${swap.poolAddress}: ${swap.amount0} -> ${swap.amount1}`)
})
```

## Examples

The SDK includes comprehensive examples in the `examples/` directory:

### Trading Examples

```bash
# Using environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://your-rpc-endpoint"
export TOKEN="0xTokenAddress"

bun run example:buy              # Buy tokens
bun run example:sell             # Sell tokens with approval management
bun run example:sell-permit      # Gasless sell with EIP-2612 permit

# Using command line arguments
bun run example:buy -- --token 0xTokenAddress --amount 0.1
bun run example:sell -- --token 0xTokenAddress --amount 100
bun run example:sell-permit -- --token 0xTokenAddress --amount 100
```

### Token Examples

```bash
# Using environment variables
export TOKENS="0xToken1,0xToken2,0xToken3"  # Multiple tokens for batch operations

bun run example:token-utils                  # Token utilities with batch operations
bun run example:approve-test                 # Token approval testing

# Using command line arguments
bun run example:token-utils -- --tokens 0xToken1,0xToken2,0xToken3
```

### Stream Examples

The SDK provides comprehensive streaming examples:

#### 🔄 Bonding Curve Examples

**1. curve_indexer** - Historical bonding curve event analysis

```bash
# Fetch historical Create, Buy, Sell events from recent blocks
bun run example:curve-indexer

# With specific block range
bun run example:curve-indexer -- --from-block 18000000 --to-block 18000100

# Filter specific tokens
bun run example:curve-indexer -- --tokens 0xToken1,0xToken2,0xToken3

# Filter specific event types
bun run example:curve-indexer -- --events Buy,Sell,Create

# Combined filtering
bun run example:curve-indexer -- --tokens 0xToken1 --events Buy,Sell --from-block 1500000
```

**2. curve_stream** - Real-time bonding curve monitoring

```bash
# Scenario 1: Monitor all bonding curve events
bun run example:curve-stream

# Scenario 2: Filter specific tokens only
bun run example:curve-stream -- --token 0xTokenAddress

# Scenario 3: Multiple token filtering
bun run example:curve-stream -- --tokens 0xToken1,0xToken2
```

Features:

- ✅ All event types: Create, Buy, Sell, Sync, Lock, Listed
- ✅ Token filtering via `--token` or `--tokens` arguments
- ✅ Real-time WebSocket streaming
- ✅ Automatic event decoding

#### 💱 DEX Examples

**3. dex_stream** - Real-time DEX swap monitoring

```bash
# Scenario 1: Auto-discover pools for multiple tokens
bun run example:dex-stream -- --tokens 0xToken1,0xToken2

# Scenario 2: Single token pool discovery
bun run example:dex-stream -- --token 0xTokenAddress

# Scenario 3: Monitor specific pools directly
bun run example:dex-stream -- --pools 0xPool1,0xPool2
```

**4. dex_indexer** - Historical DEX swap analysis

```bash
# Fetch historical Swap events from recent blocks
bun run example:dex-indexer

# With specific block range
bun run example:dex-indexer -- --from-block 18000000 --to-block 18000100

# Filter specific tokens (auto pool discovery)
bun run example:dex-indexer -- --tokens 0xToken1,0xToken2

# Monitor specific pools directly
bun run example:dex-indexer -- --pools 0xPool1,0xPool2

# Combined filtering with block range
bun run example:dex-indexer -- --tokens 0xToken1 --from-block 1500000 --to-block 1600000
```

Features:

- ✅ Automatic pool discovery for tokens
- ✅ Direct pool address monitoring
- ✅ Single token pool discovery
- ✅ Real-time Uniswap V3 swap events (dex_stream)
- ✅ Historical DEX swap analysis (dex_indexer)
- ✅ Pool metadata included
- ✅ WebSocket streaming (dex_stream)
- ✅ Block range filtering (dex_indexer)

### Testing & Verification

Quick test commands to verify functionality:

```bash
# Trading examples
bun run example:buy -- --token 0xYourTokenAddress
bun run example:sell -- --token 0xYourTokenAddress
bun run example:sell-permit -- --token 0xYourTokenAddress

# Token utilities
bun run example:token-utils -- --tokens 0xToken1,0xToken2

# Streaming (real-time)
bun run example:curve-stream
bun run example:dex-stream -- --tokens 0xYourTokenAddress

# Historical data
bun run example:curve-indexer
bun run example:dex-indexer
```

## Core Types

### Trading Types

```typescript
// Buy/Sell Parameters
interface BuyParams {
  token: Address // Token contract address
  to: Address // Recipient address
  amountIn: bigint // Amount to spend (in wei)
  amountOutMin: bigint // Minimum tokens to receive (slippage protection)
  deadline?: number // Transaction deadline (unix timestamp)
}

interface SellParams {
  token: Address
  to: Address
  amountIn: bigint
  amountOutMin: bigint
  deadline?: number
}

// Permit Parameters (EIP-2612)
interface SellPermitParams extends SellParams {
  amountAllowance: bigint // Amount to approve via permit
}

// Quote Result
interface QuoteResult {
  router: Address // Router contract to use
  amount: bigint // Calculated amount
}
```

### Token Types

```typescript
interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  address: Address // Updated: now uses proper Address type
}

// Token health and validation
interface TokenHealth {
  isContract: boolean
  hasBasicFunctions: boolean
  hasPermit: boolean // EIP-2612 permit support
  metadata: TokenMetadata | null
  permitSupport: {
    domainSeparator?: string
    currentNonce?: bigint
  }
}
```

### Event Types

```typescript
// Bonding Curve Events (simplified - see full definitions in types)
interface BuyEvent {
  type: 'Buy'
  token: Address // Updated: proper Address type
  sender: Address // Updated: proper Address type
  amountIn: bigint
  amountOut: bigint
  blockNumber: number
  transactionHash: string
}

// DEX Swap Events
interface SwapEvent {
  type: 'Swap'
  pool: Address // Updated: proper Address type
  sender: Address // Updated: proper Address type
  recipient: Address // Updated: proper Address type
  amount0: bigint
  amount1: bigint
  liquidity: bigint
  tick: number
  sqrtPriceX96: bigint
}
```

### Curve Types

```typescript
interface CurveData {
  reserveMON: bigint
  reserveToken: bigint
  k: bigint
  tokenSupply: bigint
  virtualMON: bigint
  virtualToken: bigint
  fee: bigint
  listed: boolean
}
```

## Configuration

### Environment Variables

```bash
export RPC_URL="https://your-rpc-endpoint"
export PRIVATE_KEY="your_private_key_here"
export WS_URL="wss://your-ws-endpoint"
export TOKEN="0xTokenAddress"                    # Single token for trade examples
export TOKENS="0xToken1,0xToken2,0xToken3"      # Multiple tokens for batch operations
```

### RPC Limitations

**Official Monad RPC Constraints:**

- **Block Range Limit**: Maximum 100 blocks per request
- **Automatic Batching**: The SDK automatically handles larger ranges by splitting them into multiple requests
- **Rate Limiting**: Consider using delays between requests for large historical data fetches

```typescript
// Example: Fetching 1000 blocks of data (automatically batched into 10 requests)
const indexer = new CurveIndexer(publicClient)
const events = await indexer.fetchAllEvents(
  startBlock,
  1000, // Will be split into 10 batches of 100 blocks each
  ['Buy', 'Sell']
)
```

### CLI Arguments

All examples support command line arguments for configuration:

```bash
# Available options
--rpc-url <URL>      # RPC URL
--ws-url <URL>       # WebSocket URL
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Single token address
--tokens <ADDRS>     # Multiple token addresses (comma-separated, no spaces)
--pools <ADDRS>      # Pool addresses (comma-separated, no spaces)
--amount <VALUE>     # Amount for trading examples
--slippage <PERCENT> # Slippage percentage (default: 5)
--from-block <NUM>   # Starting block number for historical data
--to-block <NUM>     # Ending block number for historical data
--events <TYPES>     # Event types filter (comma-separated)

# Trading examples
bun run example:buy -- --token 0xTokenAddress --amount 0.1 --slippage 3
bun run example:sell -- --token 0xTokenAddress --amount 100 --slippage 5

# Token utilities with multiple tokens
bun run example:token-utils -- --tokens 0xToken1,0xToken2,0xToken3

# Stream monitoring
bun run example:dex-stream -- --tokens 0xToken1,0xToken2,0xToken3
bun run example:curve-stream -- --token 0xTokenAddress

# Historical data with block range
bun run example:curve-indexer -- --from-block 1500000 --to-block 1600000
bun run example:dex-indexer -- --tokens 0xToken1 --from-block 1500000 --to-block 1600000
```

## Contract Addresses

All contract addresses are defined in `src/constants.ts`:

```typescript
export const CONTRACTS = {
  MONAD_TESTNET: {
    DEX_ROUTER: '0x4FBDC27FAE5f99E7B09590bEc8Bf20481FCf9551',
    BONDING_CURVE_ROUTER: '0x4F5A3518F082275edf59026f72B66AC2838c0414',
    LENS: '0xD47Dd1a82dd239688ECE1BA94D86f3D32960C339',
    CURVE: '0x52D34d8536350Cd997bCBD0b9E9d722452f341F5',
    WMON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
    V3_FACTORY: '0x961235a9020B05C44DF1026D956D1F4D78014276',
  },
} as const
```

## Error Handling

The SDK uses standard JavaScript error handling:

```typescript
try {
  const trade = new Trade(rpcUrl, privateKey)
  const result = await trade.getAmountOut(token, amount, true)
  console.log('Success:', result)
} catch (error) {
  console.error('Trading error:', error)
}
```

## Performance & Reliability

### ✅ Verified Features

- **Real-time Streaming**: WebSocket-based event delivery tested and working
- **Event Decoding**: Automatic parsing of bonding curve and swap events
- **Connection Stability**: Streams remain alive and process events continuously
- **Error Handling**: Graceful error handling with proper error propagation
- **Multiple Scenarios**: All streaming scenarios tested and verified

### 📊 Tested Scenarios

- **Bonding Curve**: Multiple scenarios (all events, filtered events, filtered tokens)
- **DEX Streaming**: Token discovery, pool monitoring, swap events
- **Historical Data**: Block range processing with automatic batching (respects 100 block RPC limit)
- **Pool Discovery**: Automatic Uniswap V3 pool detection for tokens

### ⚡ Performance Features

- **Efficient Filtering**: Network-level filtering for event types
- **Client-side Filtering**: Token-based filtering for precise control
- **Memory Efficient**: Stream-based processing without buffering
- **RPC Aware**: Automatically handles official RPC's 100 block limit with intelligent batching
- **TypeScript Support**: Full type safety with comprehensive type definitions

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

- 📖 [Examples](examples/) - Comprehensive usage examples
- 🐛 [Issues](https://github.com/naddotfun/nadfun-sdk-typescript/issues) - Bug reports and feature requests
- 💬 [Discussions](https://github.com/naddotfun/nadfun-sdk-typescript/discussions) - Community support
