# Nad.fun TypeScript SDK

A comprehensive TypeScript SDK for interacting with Nad.fun ecosystem contracts, including bonding curves, DEX trading, and real-time event monitoring.

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
import { Trade, Token, parseEther, formatEther } from '@nadfun/sdk'

const main = async () => {
  const rpcUrl = 'https://your-rpc-endpoint'
  const privateKey = 'your_private_key_here'

  // Trading
  const trade = new Trade(rpcUrl, privateKey)
  const token = '0x...' as `0x${string}`
  const { router, amount: amountOut } = await trade.getAmountOut(token, parseEther('0.1'), true)

  // Token operations
  const tokenHelper = new Token(rpcUrl, privateKey)
  const balance = await tokenHelper.getBalance(token)

  console.log(`Balance: ${formatEther(balance)}`)
}

main().catch(console.error)
```

## Features

### 🚀 Trading

Execute buy/sell operations on bonding curves with slippage protection:

```typescript
import { Trade, calculateSlippage, parseEther, formatEther } from '@nadfun/sdk'
import type { BuyParams } from '@nadfun/sdk'

const trade = new Trade(rpcUrl, privateKey)

// Get quote and execute buy
const { router, amount: expectedTokens } = await trade.getAmountOut(token, parseEther('0.1'), true)
const minTokens = calculateSlippage(expectedTokens, 5.0) // 5% slippage

const buyParams: BuyParams = {
  token,
  amountIn: parseEther('0.1'),
  amountOutMin: minTokens,
  to: trade.address,
  deadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes
}

const txHash = await trade.buy(buyParams, router)
console.log(`Transaction: ${txHash}`)
```

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

Interact with ERC-20 tokens and get metadata:

```typescript
import { Token, formatUnits } from '@nadfun/sdk'

const tokenHelper = new Token(rpcUrl, privateKey)

// Get token metadata
const metadata = await tokenHelper.getMetadata(token)
console.log(`Token: ${metadata.name} (${metadata.symbol})`)

// Check balances and allowances
const balance = await tokenHelper.getBalance(token, wallet)
const allowance = await tokenHelper.getAllowance(token, owner, spender)

// Approve tokens with smart approval (checks allowance first)
const txHash = await tokenHelper.checkAndApprove(token, spender, amount)
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

bun run example:buy              # Buy tokens with gas comparison
bun run example:sell             # Sell tokens with gas optimization
bun run example:sell-permit      # Gasless sell with permit signature

# Using command line arguments
bun run example:buy -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run example:sell -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run example:sell-permit -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

### Token Examples

```bash
bun run example:token-utils # Comprehensive token utilities and batch operations
```

### Stream Examples

The SDK provides comprehensive streaming examples:

#### 🔄 Bonding Curve Examples

**1. curve_indexer** - Historical bonding curve event analysis

```bash
# Fetch historical Create, Buy, Sell events
bun run example:curve-indexer

# With specific time range (respects 100 block limit per RPC call)
bun run example:curve-indexer -- --from-block 18000000 --to-block 18000100
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
POOLS=0xPool1,0xPool2 bun run example:dex-stream
```

Features:

- ✅ Automatic pool discovery for tokens
- ✅ Direct pool address monitoring
- ✅ Single token pool discovery
- ✅ Real-time Uniswap V3 swap events
- ✅ Pool metadata included
- ✅ WebSocket streaming

### Utility Examples

```bash
bun run example:gas-estimator # Gas estimation and optimization analysis
```

### Testing & Verification

All examples have been tested and verified working. Here are ready-to-run test commands:

#### 🔄 Real-time Streaming Tests

```bash
# Test bonding curve streaming (all events)
bun run example:curve-stream

# Test DEX swap streaming (auto-discover pools)
bun run example:dex-stream -- --tokens 0xYourTokenAddress

# Test with specific token filtering
bun run example:curve-stream -- --token 0xYourTokenAddress

# Test with multiple tokens
bun run example:dex-stream -- --tokens 0xToken1,0xToken2
```

#### 📊 Historical Data Tests

```bash
# Test bonding curve historical analysis
bun run example:curve-indexer -- --tokens 0xYourTokenAddress

# Test gas estimation and comparison
bun run example:gas-estimator -- --token 0xYourTokenAddress
```

#### ⚡ Quick Validation

```bash
# Minimal test - just connect and verify
bun run example:curve-stream
# Should output: "🎧 Listening for curve events..."

bun run example:dex-stream -- --token 0xTokenAddress
# Should output: "🔍 Discovering pools for 1 tokens..."
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
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"  # Multiple tokens for monitoring
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
--tokens <ADDRS>     # Multiple token addresses: 'addr1,addr2'
--help, -h           # Show help

# Example usage
bun run example:sell-permit -- \
  --rpc-url https://your-rpc-endpoint \
  --private-key your_private_key_here \
  --token 0xYourTokenAddress

# Example with multiple tokens for monitoring
bun run example:dex-stream -- \
  --tokens 0xToken1,0xToken2,0xToken3
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
