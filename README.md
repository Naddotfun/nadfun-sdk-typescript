# Nad.fun TypeScript SDK

A comprehensive TypeScript SDK for interacting with Nad.fun ecosystem contracts, including bonding curves, DEX trading, and real-time event monitoring.

## Installation

```bash
npm install @nadfun/sdk
# or
yarn add @nadfun/sdk
# or
bun add @nadfun/sdk
```

## Quick Start

```typescript
import { Trade, Token, calculateMinAmountOut } from '@nadfun/sdk'

// Trading with new gas estimation system
const trade = new Trade(rpcUrl, privateKey)
const token = '0x...' as `0x${string}`
const { router, amount } = await trade.getAmountOut(token, parseEther('0.1'), true)

// unified gas estimation (v0.2.2)
const gasParams = {
  type: 'buy' as const,
  token,
  amountIn: parseEther('0.1'),
  amountOutMin: amount,
  to: trade.account.address,
  deadline: 9999999999999999n,
}
const estimatedGas = await trade.estimateGas(router, gasParams)

// Token operations
const tokenHelper = new Token(rpcUrl, privateKey)
const balance = await tokenHelper.getBalance(token)
```

## Features

### 🚀 Trading

Execute buy/sell operations on bonding curves with slippage protection:

```typescript
import { Trade, calculateMinAmountOut, type GasEstimationParams } from '@nadfun/sdk'

// Get quote and execute buy
const { router, amount: expectedTokens } = await trade.getAmountOut(token, monAmount, true)
const minTokens = calculateMinAmountOut(expectedTokens, 5.0)

// Use new unified gas estimation system
const gasParams: GasEstimationParams = {
  type: 'buy',
  token,
  amountIn: monAmount,
  amountOutMin: minTokens,
  to: walletAddress,
  deadline,
}

// Get accurate gas estimation from network
const estimatedGas = await trade.estimateGas(router, gasParams)
const gasWithBuffer = (estimatedGas * 120n) / 100n // Add 20% buffer

const result = await trade.buy(
  {
    token,
    amountIn: monAmount,
    amountOutMin: minTokens,
    to: walletAddress,
    deadline,
    gasLimit: gasWithBuffer, // Use network-based estimation
  },
  router
)
```

### ⛽ Gas Management

v0.2.2 introduces a unified gas estimation system that replaces static constants with real-time network estimation:

#### Unified Gas Estimation (New in v0.2.2)

```typescript
import { Trade, type GasEstimationParams } from '@nadfun/sdk'

// Create gas estimation parameters for any operation
const gasParams: GasEstimationParams = {
  type: 'buy', // or 'sell', 'sellPermit'
  token,
  amountIn: monAmount,
  amountOutMin: minTokens,
  to: walletAddress,
  deadline,
}

// Get real-time gas estimation from network
const estimatedGas = await trade.estimateGas(router, gasParams)

// Apply buffer strategy
const gasWithBuffer = (estimatedGas * 120n) / 100n // 20% buffer
```

#### Gas Estimation Parameters

```typescript
type GasEstimationParams = {
  type: 'buy' | 'sell' | 'sellPermit'
  token: `0x${string}`
  amountIn: bigint
  amountOutMin: bigint
  to: `0x${string}`
  deadline: bigint
  // For sellPermit only
  v?: number
  r?: `0x${string}`
  s?: `0x${string}`
}
```

#### Automatic Problem Solving

The new system automatically handles common issues:

- **Token Approval**: SELL operations automatically check and approve tokens
- **Permit Signatures**: SELL PERMIT operations generate real EIP-2612 signatures
- **Network Conditions**: Uses actual network state instead of static estimates
- **Error Recovery**: Graceful fallback when estimation fails

#### Buffer Strategies

```typescript
// Fixed buffer amounts
const gasFixedBuffer = estimatedGas + 50_000n // +50k gas

// Percentage-based buffers
const gas20Percent = (estimatedGas * 120n) / 100n // 20% buffer
const gas25Percent = (estimatedGas * 125n) / 100n // 25% buffer (for complex operations)

// Choose based on operation complexity
const finalGas = (() => {
  switch (operationType) {
    case 'buy':
      return (estimatedGas * 120n) / 100n // 20% buffer
    case 'sell':
      return (estimatedGas * 115n) / 100n // 15% buffer
    case 'sellPermit':
      return (estimatedGas * 125n) / 100n // 25% buffer
    default:
      return estimatedGas + 50_000n // Fixed buffer
  }
})()
```

#### Migration from Earlier Versions

```typescript
// OLD - Static constants
import { getDefaultGasLimit } from '@nadfun/sdk'
const gasLimit = getDefaultGasLimit(router, 'buy')

// NEW (v0.2.2) - Network-based estimation
const params: GasEstimationParams = {
  type: 'buy',
  token,
  amountIn,
  amountOutMin,
  to,
  deadline,
}
const estimatedGas = await trade.estimateGas(router, params)
const gasLimit = (estimatedGas * 120n) / 100n // Apply buffer
```

⚠️ **Important Notes:**

- **SELL Operations**: Require token approval for router (automatically handled in examples)
- **SELL PERMIT Operations**: Need valid EIP-2612 permit signatures (automatically generated)
- **Network Connection**: Live RPC required for accurate estimation

### 📊 Token Operations

Interact with ERC-20 tokens and get metadata:

```typescript
import { Token } from '@nadfun/sdk'

const tokenHelper = new Token(rpcUrl, privateKey)

// Get token metadata
const metadata = await tokenHelper.getMetadata(token)
console.log(`Token: ${metadata.name} (${metadata.symbol})`)

// Check balances and allowances
const balance = await tokenHelper.getBalance(token)
const allowance = await tokenHelper.getAllowance(token, spender)

// Approve tokens
const tx = await tokenHelper.approve(token, spender, amount)

// Generate permit signatures (EIP-2612)
const signature = await tokenHelper.generatePermitSignature(token, spender, amount, deadline)
```

### 🔄 Real-time Event Streaming

Monitor bonding curve and DEX events in real-time:

#### Bonding Curve Streaming

```typescript
import { CurveStream } from '@nadfun/sdk/stream'
import { CurveEventType } from '@nadfun/sdk/types'

// Create WebSocket stream
const curveStream = new CurveStream('wss://your-ws-endpoint')

// Configure filters (optional)
curveStream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell])
curveStream.filterTokens([tokenAddress])

// Subscribe and process events
const unsubscribe = curveStream.onEvent(event => {
  console.log(`Event: ${event.type} for token ${event.token}`)
})

await curveStream.start()
```

#### DEX Swap Streaming

```typescript
import { DexStream } from '@nadfun/sdk/stream'

// Auto-discover pools for tokens
const swapStream = await DexStream.discoverPoolsForTokens('wss://your-ws-endpoint', [tokenAddress])

// Subscribe and process events
swapStream.onSwap(event => {
  console.log(`Swap in pool ${event.pool}: ${event.amount0} -> ${event.amount1}`)
})

await swapStream.start()
```

### 📈 Historical Data Analysis

Fetch and analyze historical events:

```typescript
import { CurveIndexer, CurveEventType } from '@nadfun/sdk/stream'

const indexer = new CurveIndexer('https://your-rpc-endpoint')

// Fetch events from block range
const events = await indexer.fetchEvents(
  18_000_000,
  18_010_000,
  [CurveEventType.Create, CurveEventType.Buy],
  undefined // all tokens
)

console.log(`Found ${events.length} events`)
```

### 🔍 Pool Discovery

Find Uniswap V3 pool addresses for tokens:

```typescript
import { DexIndexer } from '@nadfun/sdk/stream'

// Auto-discover pools for multiple tokens
const indexer = await DexIndexer.discoverPoolsForTokens('https://your-rpc-endpoint', tokens)
const pools = indexer.getPoolAddresses()

// Fetch swap events
const swaps = await indexer.fetchEvents(fromBlock, toBlock)
```

## Examples

The SDK includes comprehensive examples in the `examples/` directory:

### Trading Examples

```bash
# Using environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://your-rpc-endpoint"
export TOKEN="0xTokenAddress"
export RECIPIENT="0xRecipientAddress"  # For token operations

bun run example:buy              # Buy tokens with network-based gas estimation
bun run example:sell             # Sell tokens with automatic approval handling
bun run example:sell-permit      # Gasless sell with real permit signatures
bun run example:gas-estimation   # Comprehensive gas estimation example (NEW)

# Using command line arguments
bun run example:buy -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run example:sell -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run example:sell-permit -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run example:gas-estimation -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

### Gas Estimation Example (New in v0.2.2)

```bash
# Comprehensive gas estimation with automatic problem solving
bun run example:gas-estimation -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- **Unified Gas Estimation**: Demonstrates `trade.estimateGas()` for all operation types
- **Automatic Approval**: Handles token approval for SELL operations automatically
- **Real Permit Signatures**: Generates valid EIP-2612 signatures for SELL PERMIT operations
- **Buffer Strategies**: Shows different buffer calculation methods (fixed +50k, percentage 20%-25%)
- **Cost Analysis**: Real-time transaction cost estimates at different gas prices
- **Error Handling**: Graceful fallback when estimation fails

### Token Examples

```bash
bun run example:basic-operations  # Basic ERC-20 operations
bun run example:permit-signature  # EIP-2612 permit signatures
```

### Stream Examples

The SDK provides comprehensive streaming examples organized by category:

#### 🔄 Bonding Curve Examples

**1. curve_indexer** - Historical bonding curve event analysis

```bash
# Fetch historical CurveCreate, CurveBuy, CurveSell events
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint

# With specific tokens
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2
```

**2. curve_stream** - Real-time bonding curve monitoring

```bash
# Scenario 1: Monitor all bonding curve events
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint

# Scenario 2: Filter specific event types (CurveBuy/CurveSell only)
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --events CurveBuy, CurveSell

# Scenario 3: Filter specific tokens only
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --tokens 0xToken1,0xToken2

# Scenario 4: Combined filtering (events AND tokens)
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --events CurveBuy,CurveSell --tokens 0xToken1
```

**Features:**

- ✅ All event types: CurveCreate,CurveBuy,CurveSell,CurveSync,CurveTokenLocked,CurveTokenListed
- ✅ Event type filtering via `--events` argument
- ✅ Token filtering via `--tokens` argument
- ✅ Combined filtering (events + tokens)
- ✅ Real-time WebSocket streaming
- ✅ Automatic event decoding

#### 💱 DEX Examples

**3. dex_indexer** - Historical DEX swap data analysis

```bash
# Discover pools and fetch historical swap events
bun run example:dex-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2

# Use specific pool addresses
bun run example:dex-indexer -- --rpc-url https://your-rpc-endpoint --pools 0xPool1,0xPool2
```

**4. dex_stream** - Real-time DEX swap monitoring

```bash
# Scenario 1: Monitor specific pool addresses directly
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --pools 0xPool1,0xPool2

# Scenario 2: Auto-discover pools for multiple tokens
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --tokens 0xToken1,0xToken2

# Scenario 3: Single token pool discovery
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --token 0xTokenAddress
```

**Features:**

- ✅ Automatic pool discovery for tokens
- ✅ Direct pool address monitoring
- ✅ Single token pool discovery
- ✅ Real-time Uniswap V3 swap events
- ✅ Pool metadata included
- ✅ WebSocket streaming

#### 🔍 Pool Discovery

**5. pool_discovery** - Automated pool address discovery

```bash
# Find Uniswap V3 pools for multiple tokens
bun run example:pool-discovery -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2

# Discover pools for single token
bun run example:pool-discovery -- --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

## Core Types

### Event Types

- **BondingCurveEvent**: Unified type for all bonding curve events
  - CurveCreate, CurveBuy, CurveSell, CurveSync, CurveTokenLocked, CurveTokenListed variants
  - Properties: `token`, `type`, `blockNumber`, `transactionHash`
- **SwapEvent**: Uniswap V3 swap events with complete metadata
  - Fields: `pool`, `amount0`, `amount1`, `sender`, `recipient`, `liquidity`, `tick`, `sqrtPriceX96`
- **CurveEventType**: Enum for filtering bonding curve events
  - Variants: CurveCreate, CurveBuy, CurveSell, CurveSync, CurveTokenLocked, CurveTokenListed

### Stream Types

- **CurveStream**: Bonding curve event streaming
  - Methods: `subscribeEvents()`, `filterTokens()`, `onEvent()`, `start()`, `stop()`
- **DexStream**: DEX swap event streaming
  - Methods: `discoverPoolsForTokens()`, `onSwap()`, `start()`, `stop()`

### Trading Types

- **BuyParams / SellParams**: Parameters for buy/sell operations
- **TradeResult**: Transaction result with status and metadata
- **GasEstimationParams**: Parameters for gas estimation

### Token Types

- **TokenMetadata**: Name, symbol, decimals, total supply
- **PermitSignature**: EIP-2612 permit signature data (v, r, s)

## Configuration

### Environment Variables

```bash
export RPC_URL="https://your-rpc-endpoint"
export WS_RPC_URL="wss://your-ws-endpoint"
export PRIVATE_KEY="your_private_key_here"
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"  # Multiple tokens for monitoring
export POOLS="0xPool1,0xPool2"     # Pool addresses for DEX monitoring
export RECIPIENT="0xRecipientAddress"
export EVENTS="CurveCreate,CurveBuy,CurveSell,CurveSync,CurveTokenLocked,CurveTokenListed"    # Event types to monitor
```

### CLI Arguments

All examples support command line arguments for configuration:

```bash
# Available options
--rpc-url <URL>      # RPC URL for HTTP operations
--ws-url <URL>       # WebSocket URL for streaming
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Token address for operations
--tokens <ADDRS>     # Token addresses: 'addr1,addr2'
--pools <ADDRS>      # Pool addresses: 'pool1,pool2'
--recipient <ADDR>   # Recipient address for transfers/allowances
--events <TYPES>     # Event types: 'Buy,Sell,Create'

# Example usage
bun run example:sell-permit -- \
  --rpc-url https://your-rpc-endpoint \
  --private-key your_private_key_here \
  --token 0xYourTokenAddress

# Example with recipient (for token operations)
bun run example:basic-operations -- \
  --private-key your_private_key_here \
  --rpc-url https://your-rpc-endpoint \
  --token 0xYourTokenAddress \
  --recipient 0xRecipientAddress

# Example with multiple tokens for monitoring
bun run example:dex-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2,0xToken3
```

## Contract Addresses

All contract addresses are defined in `constants.ts`:

- **Bonding Curve**: `0x52D34d8536350Cd997bCBD0b9E9d722452f341F5`
- **Bonding Curve Router**: `0x4F5A3518F082275edf59026f72B66AC2838c0414`
- **DEX Router**: `0x4FBDC27FAE5f99E7B09590bEc8Bf20481FCf9551`
- **WMON Token**: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`

## Error Handling

The SDK uses standard TypeScript error handling:

```typescript
try {
  const trade = new Trade(rpcUrl, privateKey)
  const result = await trade.getAmountOut(token, amount, true)
} catch (error) {
  console.error('Error:', error)
}
```

## Testing & Verification

All examples have been tested and verified working. Here are ready-to-run test commands:

### 🔄 Real-time Streaming Tests

```bash
# Test bonding curve streaming (all events)
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint

# Test DEX swap streaming (auto-discover pools)
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --tokens 0xYourTokenAddress

# Test with event filtering
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --events CurveCreate,CurveBuy

# Test with specific pool monitoring
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --pools 0xPool1,0xPool2
```

### 📊 Historical Data Tests

```bash
# Test bonding curve historical analysis
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xYourTokenAddress

# Test pool discovery
bun run example:pool-discovery -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2

# Test DEX historical analysis
bun run example:dex-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xYourTokenAddress
```

### ⚡ Quick Validation

```bash
# Minimal test - just connect and verify
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint
# Should output: "🔴 Listening for ALL bonding curve events..."

bun run example:dex-stream -- --token 0xTokenAddress --ws-url wss://your-ws-endpoint
# Should output: "✅ Discovered X pools"
```

## Performance & Reliability

### ✅ Verified Features

- **Real-time Streaming**: WebSocket-based event delivery tested and working
- **Event Decoding**: Automatic parsing of bonding curve and swap events
- **Connection Stability**: Auto-reconnection with exponential backoff
- **Error Handling**: Comprehensive error handling with proper types
- **Multiple Scenarios**: All streaming scenarios tested and verified

### 📊 Tested Scenarios

- **Bonding Curve**: 4 scenarios (all events, filtered events, filtered tokens, combined)
- **DEX Streaming**: 3 scenarios (specific pools, token discovery, single token)
- **Historical Data**: Block range processing with automatic batching
- **Pool Discovery**: Automatic Uniswap V3 pool detection for tokens

### ⚡ Performance Features

- **Efficient Filtering**: Network-level filtering for event types
- **Client-side Filtering**: Token-based filtering for precise control
- **Concurrent Processing**: Parallel block processing for historical data
- **Memory Efficient**: Stream-based processing without buffering
- **TypeScript Native**: Full type safety and IntelliSense support

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

- 📖 [Examples](examples/) - Comprehensive usage examples
- 🐛 [Issues](https://github.com/yourusername/nadfun-sdk-typescript/issues) - Bug reports and feature requests
