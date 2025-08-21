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
import { Trade, Token, parseEther } from '@nadfun/sdk' // Import everything you need
import { type Address } from 'viem'

async function main() {
  const rpcUrl = 'https://your-rpc-endpoint'
  const privateKey = '0x...' // Your private key

  // Trading with new gas estimation system
  const trade = new Trade(rpcUrl, privateKey)
  const token: Address = '0x...'
  const { router, amount: amountOut } = await trade.getAmountOut(token, parseEther('0.1'), true)

  // New unified gas estimation (v0.2.2)
  const gasParams = {
    type: 'buy' as const,
    token,
    amountIn: parseEther('0.1'),
    amountOutMin: amountOut,
    to: trade.account.address,
    deadline: 9999999999999999n,
  }
  const estimatedGas = await trade.estimateGas(router, gasParams)

  // Token operations
  const tokenHelper = new Token(rpcUrl, privateKey)
  const balance = await tokenHelper.getBalance(token, '0x...' as Address)
}

main().catch(console.error)
```

## Features

### 🚀 Trading

Execute buy/sell operations on bonding curves with slippage protection:

```typescript
import { Trade, calculateMinAmountOut, type BuyParams } from '@nadfun/sdk'

// Get quote and execute buy
const { router, amount: expectedTokens } = await trade.getAmountOut(token, monAmount, true)
const minTokens = calculateMinAmountOut(expectedTokens, 5.0)

// Use new unified gas estimation system
const gasParams = {
  type: 'buy' as const,
  token,
  amountIn: monAmount,
  amountOutMin: minTokens,
  to: trade.account.address,
  deadline: 9999999999999999n,
}

// Get accurate gas estimation from network
const estimatedGas = await trade.estimateGas(router, gasParams)
const gasWithBuffer = (estimatedGas * 120n) / 100n // Add 20% buffer

const buyParams: BuyParams = {
  token,
  amountIn: monAmount,
  amountOutMin: minTokens,
  to: trade.account.address,
  deadline: 9999999999999999n,
  gasLimit: gasWithBuffer, // Use network-based estimation
  gasPrice: 50_000_000_000n, // 50 gwei
  nonce: undefined, // Auto-detect
}

const result = await trade.buy(buyParams, router)
```

### ⛽ Gas Management

**v0.2.2 introduces a unified gas estimation system** that replaces static constants with real-time network estimation:

#### Unified Gas Estimation (New in v0.2.2)

```typescript
import { Trade, type GasEstimationParams } from '@nadfun/sdk'

// Create gas estimation parameters for any operation
const gasParams: GasEstimationParams = {
  type: 'buy',
  token,
  amountIn: monAmount,
  amountOutMin: minTokens,
  to: trade.account.address,
  deadline: 9999999999999999n,
}

// Get real-time gas estimation from network
const estimatedGas = await trade.estimateGas(router, gasParams)
ƒ
// Apply buffer strategy
const gasWithBuffer = (estimatedGas * 120n) / 100n // 20% buffer
```

#### Gas Estimation Parameters

```typescript
type GasEstimationParams =
  // For buying tokens
  | { type: 'buy'; token; amountIn; amountOutMin; to; deadline }

  // For selling tokens (requires token approval)
  | { type: 'sell'; token; amountIn; amountOutMin; to; deadline }

  // For gasless selling with permits
  | { type: 'sellPermit'; token; amountIn; amountOutMin; to; deadline; v; r; s }
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

#### Migration from v0.1.x

```typescript
// OLD (v0.1.x) - Static constants
import { BondingCurveGas, getDefaultGasLimit, Operation } from '@nadfun/sdk'
const gasLimit = getDefaultGasLimit(router, Operation.Buy)

// NEW (v0.2.2) - Network-based estimation
import { type GasEstimationParams } from '@nadfun/sdk'
const params: GasEstimationParams = { type: 'buy', token, amountIn, amountOutMin, to, deadline }
const estimatedGas = await trade.estimateGas(router, params)
const gasLimit = (estimatedGas * 120n) / 100n // Apply buffer
```

**⚠️ Important Notes:**

- **SELL Operations**: Require token approval for router (automatically handled in examples)
- **SELL PERMIT Operations**: Need valid EIP-2612 permit signatures (automatically generated)
- **Network Connection**: Live RPC required for accurate estimation

### 📊 Token Operations

Enhanced ERC-20 token interactions with advanced features:

```typescript
import { Token } from '@nadfun/sdk'

const tokenHelper = new Token(rpcUrl, privateKey)

// Get token metadata
const metadata = await tokenHelper.getMetadata(token)
console.log(`Token: ${metadata.name} (${metadata.symbol})`)

// Check balances and allowances
const balance = await tokenHelper.getBalance(token, wallet)
const allowance = await tokenHelper.getAllowance(token, spender, owner)

// Approve tokens
const tx = await tokenHelper.approve(token, spender, amount)

// New: Batch operations for efficiency
const balances = await tokenHelper.batchGetBalances([token1, token2, token3])
const metadata = await tokenHelper.batchGetMetadata([token1, token2])
const allowances = await tokenHelper.batchGetAllowances(token, [spender1, spender2])

// New: Token health check
const health = await tokenHelper.getTokenHealth(token)
console.log(`Is contract: ${health.isContract}, Has basic functions: ${health.hasBasicFunctions}`)

// New: Burn tokens (ERC20Burnable)
const burnTx = await tokenHelper.burn(token, amount)
const burnFromTx = await tokenHelper.burnFrom(token, account, amount)

// New: EIP-2612 Permit signatures
const permitSig = await tokenHelper.generatePermitSignature(token, spender, value, deadline)
```

### 🔄 Real-time Event Streaming

Monitor bonding curve and DEX events in real-time:

#### Bonding Curve Streaming

```typescript
import { CurveStream, CurveEventType, type BondingCurveEvent } from '@nadfun/sdk'

// Create stream with RPC endpoint
const curveStream = new CurveStream('https://your-rpc-endpoint')

// Configure filters (optional)
curveStream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell]).filterTokens([tokenAddress])

// Subscribe and process events
const unsubscribe = await curveStream.subscribe(
  (event: BondingCurveEvent) => {
    console.log(`Event: ${event.eventType} for token ${event.token}`)
  },
  error => {
    console.error('Error:', error)
  }
)

// Later: unsubscribe()
```

#### DEX Swap Streaming

```typescript
import { DexStream } from '@nadfun/sdk'

// Auto-discover pools for tokens
const dexStream = await DexStream.discoverPoolsForTokens('https://your-rpc-endpoint', [
  tokenAddress,
])

// Subscribe and process events
const unsubscribe = await dexStream.subscribe(
  event => {
    console.log(`Swap in pool ${event.poolAddress}: ${event.amount0} -> ${event.amount1}`)
  },
  error => {
    console.error('Error:', error)
  }
)
```

### 📈 Historical Data Analysis

Fetch and analyze historical events with WebSocket support:

```typescript
import { CurveIndexer, CurveEventType } from '@nadfun/sdk'

// Now supports both HTTP and WebSocket connections
const indexer = new CurveIndexer('https://your-rpc-endpoint')
// or
const indexer = new CurveIndexer('wss://your-websocket-endpoint')

// Fetch events from block range
const events = await indexer.fetchEvents(
  18_000_000,
  18_000_100,
  [CurveEventType.Create, CurveEventType.Buy],
  ['0xToken1', '0xToken2'] // optional token filter
)

// Batch fetch with automatic pagination
const allEvents = await indexer.fetchAllEvents(
  startBlock,
  2000, // batch size
  [CurveEventType.Buy, CurveEventType.Sell],
  tokenFilter
)

console.log(`Found ${events.length} events`)
```

### 🔍 Pool Discovery

Find Uniswap V3 pool addresses for tokens with simplified API:

```typescript
import { DexIndexer } from '@nadfun/sdk'

// Auto-discover pools for multiple tokens (now with direct RPC URL)
const indexer = await DexIndexer.discoverPoolsForTokens('https://your-rpc-endpoint', tokens)

// Discover pool for single token
const indexer2 = await DexIndexer.discoverPoolForToken('https://your-rpc-endpoint', token)

// Access discovered pools
console.log(`Found ${indexer.poolAddresses.length} pools`)
```

### 💱 DEX Monitoring

Monitor Uniswap V3 swap events with enhanced features:

```typescript
import { DexIndexer } from '@nadfun/sdk'

// Auto-discover pools for tokens with WebSocket support
const indexer = await DexIndexer.discoverPoolsForTokens('wss://your-websocket-endpoint', tokens)

// Fetch swap events with automatic batching
const swaps = await indexer.fetchEvents(fromBlock, toBlock)

// Process swaps with pool metadata
for (const swap of swaps) {
  console.log(`Swap: ${swap.amount0} -> ${swap.amount1}`)
  console.log(`Pool: ${swap.poolAddress}`)
  console.log(`Sender: ${swap.sender}, Recipient: ${swap.recipient}`)
}

// Batch fetch all events
const allSwaps = await indexer.fetchAllEvents(startBlock, 2000)
console.log(`Total swaps: ${allSwaps.length}`)
```

## Examples

The SDK includes comprehensive examples in the `examples/` directory:

### Trading Examples

```bash
# Using environment variables
export PRIVATE_KEY="0x..."
export RPC_URL="https://your-rpc-endpoint"
export TOKEN="0xTokenAddress"
export RECIPIENT="0xRecipientAddress"  # For token operations

bun run example:buy              # Buy tokens with network-based gas estimation
bun run example:sell             # Sell tokens with automatic approval handling
bun run example:sell-permit      # Gasless sell with real permit signatures
bun run example:gas-estimation   # Comprehensive gas estimation example (NEW)
bun run example:token-utils      # Token operations (requires recipient)

# Using command line arguments
bun run examples/trade/buy.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run examples/trade/sell.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run examples/trade/sell_permit.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run examples/trade/gas_estimation.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
bun run examples/token/token_utils.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress --recipient 0xRecipientAddress
```

### Gas Estimation Example (New in v0.2.2)

```bash
# Comprehensive gas estimation with automatic problem solving
bun run example:gas-estimation
# or
bun run examples/trade/gas_estimation.ts -- --private-key 0x... --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
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
bun run example:token-utils  # Basic ERC-20 operations
```

### Stream Examples

The SDK provides 4 comprehensive streaming examples organized by category:

#### 🔄 Bonding Curve Examples

**1. curve_indexer** - Historical bonding curve event analysis

```bash
# Fetch historical Create, Buy, Sell events
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint

# With specific tokens and time range
bun run example:curve-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2
```

**2. curve_stream** - Real-time bonding curve monitoring

```bash
# Scenario 1: Monitor all bonding curve events
bun run example:curve-stream -- --rpc-url https://your-rpc-endpoint

# Scenario 2: Filter specific event types (Buy/Sell only)
EVENTS=Buy,Sell bun run example:curve-stream -- --rpc-url https://your-rpc-endpoint

# Scenario 3: Filter specific tokens only
bun run example:curve-stream -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2

# Scenario 4: Combined filtering (events AND tokens)
EVENTS=Buy,Sell bun run example:curve-stream -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1
```

**Features:**

- ✅ All event types: Create, Buy, Sell, Sync, Lock, Listed
- ✅ Event type filtering via `EVENTS` environment variable (use CurveEventType enum values)
- ✅ Token filtering via `--tokens` argument
- ✅ Combined filtering (events + tokens)
- ✅ Real-time event streaming
- ✅ Automatic event decoding

#### 💱 DEX Examples

**3. dex_indexer** - Historical DEX swap data analysis

```bash
# Discover pools and fetch historical swap events
bun run example:dex-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2

# Batch process with JSON array format
bun run example:dex-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens '["0xToken1","0xToken2"]'
```

**4. dex_stream** - Real-time DEX swap monitoring

```bash
# Scenario 1: Monitor specific pool addresses directly
POOLS=0xPool1,0xPool2 bun run example:dex-stream -- --rpc-url https://your-rpc-endpoint

# Scenario 2: Auto-discover pools for multiple tokens
bun run example:dex-stream -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2

# Scenario 3: Single token pool discovery
bun run example:dex-stream -- \
  --rpc-url https://your-rpc-endpoint \
  --token 0xTokenAddress
```

**Features:**

- ✅ Automatic pool discovery for tokens
- ✅ Direct pool address monitoring
- ✅ Single token pool discovery
- ✅ Real-time Uniswap V3 swap events
- ✅ Pool metadata included
- ✅ Real-time streaming

### Testing & Verification

All examples have been tested and verified working. Here are ready-to-run test commands:

#### 🔄 Real-time Streaming Tests

```bash
# Test bonding curve streaming (all events)
bun run example:curve-stream -- --rpc-url https://your-rpc-endpoint

# Test DEX swap streaming (auto-discover pools)
bun run example:dex-stream -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xYourTokenAddress

# Test with event filtering
EVENTS=Buy,Sell bun run example:curve-stream -- --rpc-url https://your-rpc-endpoint

# Test with specific pool monitoring
POOLS=0xPool1,0xPool2 bun run example:dex-stream -- --rpc-url https://your-rpc-endpoint
```

#### 📊 Historical Data Tests

```bash
# Test bonding curve historical analysis
bun run example:curve-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xYourTokenAddress

# Test DEX historical analysis
bun run example:dex-indexer -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xYourTokenAddress
```

#### ⚡ Quick Validation

```bash
# Minimal test - just connect and verify
bun run example:curve-stream -- --rpc-url https://your-rpc-endpoint
# Should output: "Listening for ALL bonding curve events..."

bun run example:dex-stream -- --token 0xTokenAddress --rpc-url https://your-rpc-endpoint
# Should output: "Discovered X pools for 1 tokens"
```

## Core Types

### Event Types

- `BondingCurveEvent`: Unified type for all bonding curve events
  - `Create`, `Buy`, `Sell`, `Sync`, `Lock`, `Listed` variants
  - Properties: `.token`, `.eventType`, `.blockNumber`, `.transactionIndex`
- `SwapEvent`: Uniswap V3 swap events with complete metadata
  - Fields: `poolAddress`, `amount0`, `amount1`, `sender`, `recipient`, `liquidity`, `tick`, `sqrtPriceX96`
- `CurveEventType`: Enum for filtering bonding curve events
  - Values: `Create`, `Buy`, `Sell`, `Sync`, `Lock`, `Listed`

### Stream Types

- `CurveStream`: Bonding curve event streaming
  - Methods: `.subscribeEvents()`, `.filterTokens()`, `.subscribe()`
  - Returns: Subscription with unsubscribe function
- `DexStream`: DEX swap event streaming
  - Methods: `.new()`, `.discoverPoolsForTokens()`, `.discoverPoolForToken()`, `.subscribe()`
  - Returns: Subscription with unsubscribe function

### Trading Types

- `BuyParams` / `SellParams`: Parameters for buy/sell operations
- `TradeResult`: Transaction result with status and metadata
- `calculateMinAmountOut` / `calculateMaxAmountIn`: Slippage calculation functions

### Token Types

- `TokenMetadata`: Name, symbol, decimals, total supply
- `PermitSignature`: EIP-2612 permit signature data

## Configuration

### Environment Variables

```bash
export RPC_URL="https://your-rpc-endpoint"
export PRIVATE_KEY="0x..."
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"  # Multiple tokens for monitoring
export RECIPIENT="0xRecipientAddress"
```

### CLI Arguments

All examples support command line arguments for configuration:

```bash
# Available options
--rpc-url <URL>      # RPC URL (default: https://your-rpc-endpoint)
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Token address for operations
--tokens <ADDRS>     # Token addresses: 'addr1,addr2' or '["addr1","addr2"]'
--recipient <ADDR>   # Recipient address for transfers/allowances
--help, -h           # Show help

# Example usage
bun run examples/trade/sell_permit.ts -- \
  --rpc-url https://your-rpc-endpoint \
  --private-key 0x... \
  --token 0xYourTokenAddress

# Example with recipient (for token operations)
bun run examples/token/token_utils.ts -- \
  --private-key 0x... \
  --rpc-url https://your-rpc-endpoint \
  --token 0xYourTokenAddress \
  --recipient 0xRecipientAddress

# Example with multiple tokens for monitoring
bun run examples/stream/dex_indexer.ts -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens 0xToken1,0xToken2,0xToken3

# Example with JSON array format
bun run examples/stream/dex_indexer.ts -- \
  --rpc-url https://your-rpc-endpoint \
  --tokens '["0xToken1","0xToken2"]'
```

### Contract Addresses

All contract addresses are defined in `constants.ts`:

- Bonding Curve: `0x52D34d8536350Cd997bCBD0b9E9d722452f341F5`
- Bonding Curve Router: `0x4F5A3518F082275edf59026f72B66AC2838c0414`
- DEX Router: `0x4FBDC27FAE5f99E7B09590bEc8Bf20481FCf9551`
- WMON Token: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`

## Error Handling

The SDK uses standard Promise/async-await patterns for error handling:

```typescript
try {
  const trade = new Trade(rpcUrl, privateKey)
  const result = await trade.getAmountOut(token, amount, true)
} catch (error) {
  console.error('Error:', error)
}
```

## Performance & Reliability

### ✅ Verified Features

- **Real-time Streaming**: Event monitoring via RPC polling tested and working
- **Event Decoding**: Automatic parsing of bonding curve and swap events
- **Connection Stability**: Automatic reconnection and error recovery
- **Error Handling**: Graceful error handling with callback pattern
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
