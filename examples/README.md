# Nad.fun SDK Examples

This directory contains comprehensive examples demonstrating how to use the Nad.fun SDK for trading, token operations, and real-time event streaming.

## What's New (v0.2.3)

- 🎯 **Enhanced Token Utils**: Demonstrates new batch operations, burn functions, and health checks
- 🚀 **Improved Streaming Examples**: WebSocket support and simplified APIs
- 📊 **Cleaner Code**: All examples updated with latest SDK improvements

## 💰 Trading Examples

### 1. Buy Tokens (`trade/buy.ts`)

Buy tokens with MON including advanced gas management and slippage protection.

```bash
# Using environment variables
export PRIVATE_KEY="0x..."
export RPC_URL="https://testnet.monad.xyz"
export TOKEN="0xTokenAddress"
bun run example:buy

# Using command line arguments
bun run examples/trade/buy.ts -- --private-key 0x... --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 0.1
```

**Features:**

- ⛽ **Smart Gas Management**: Real-time estimation with network-based optimization
- 🔄 **Automatic Router Detection**: Bonding curve vs DEX routing
- 🛡️ **Slippage Protection**: 5% default with customizable amount_out_min
- 📊 **Network Gas Price Optimization**: EIP-1559 compatible with 3x multiplier
- ✅ **Balance Verification**: MON balance checking before execution
- 📝 **Transaction Verification**: Complete result validation

**Example Output:**

```
💰 Account MON balance: 10.5 MON
⛽ Network gas price: 25 gwei
⛽ Recommended gas price: 75 gwei
⛽ Estimated gas for buy: 245,123
⛽ Gas with 20% buffer: 294,147
🛡️ Slippage protection:
  Expected tokens: 1234567890123456789
  Minimum tokens (5% slippage): 1172839745617283950
✅ Buy successful!
  Transaction hash: 0x...
  Gas used: 247,891
```

### 2. Sell Tokens (`trade/sell.ts`)

Sell tokens for MON with automatic approval and intelligent gas optimization.

```bash
bun run example:sell -- --private-key 0x... --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 100
```

**Features:**

- 🔍 **Token Balance Verification**: Ensures sufficient token balance
- 📋 **Automatic Approval Handling**: Checks allowance and approves if needed
- ⛽ **Dynamic Gas Estimation**: Real-time gas estimation with safe buffers
- 🛡️ **Slippage Protection**: Configurable slippage tolerance
- 🔄 **Two-step Process**: Approve → Sell workflow
- 📊 **Gas Comparison**: Shows estimated vs actual gas usage

### 3. Gasless Sell (`trade/sell_permit.ts`)

Advanced gasless selling using EIP-2612 permit signatures.

```bash
bun run example:sell-permit -- --private-key 0x... --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 100
```

**Features:**

- 🔐 **EIP-2612 Permit Signatures**: Cryptographic gasless approvals
- ⚡ **One Transaction**: Combined approval + sell in single tx
- ⛽ **Optimized Gas**: Higher gas limits for complex permit transactions
- 🛡️ **Security**: Proper nonce and deadline management
- 📝 **Signature Details**: v, r, s component logging for transparency

### 4. Gas Estimation (`trade/gas_estimation.ts`)

Comprehensive gas estimation example demonstrating the v0.2.2 unified system.

```bash
bun run example:gas-estimation -- --private-key 0x... --rpc-url https://testnet.monad.xyz --token 0xTokenAddress
```

**Features:**

- **Unified Gas Estimation**: Demonstrates `trade.estimateGas()` for all operation types
- **Automatic Approval**: Handles token approval for SELL operations
- **Real Permit Signatures**: Generates valid EIP-2612 signatures
- **Buffer Strategies**: Shows different buffer calculation methods
- **Cost Analysis**: Real-time transaction cost estimates

## 🪙 Token Operations

### 5. Token Utils (`token/token_utils.ts`)

Comprehensive ERC-20 token interaction patterns with advanced features.

```bash
bun run example:token-utils -- --private-key 0x... --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --recipient 0xRecipientAddress
```

**Features:**

- 📊 **Token Metadata**: Name, symbol, decimals, total supply retrieval
- 💰 **Balance Operations**: Check balances for any address
- 📝 **Allowance Management**: Check and set token approvals
- 💸 **Token Transfers**: Safe token transfer operations
- 🔥 **Token Burning**: Burn and burnFrom operations (NEW)
- 📦 **Batch Operations**: Efficient batch balance/metadata queries (NEW)
- 🏥 **Token Health Check**: Validate token contract status (NEW)
- 🔐 **Permit Signatures**: EIP-2612 gasless approvals (NEW)
- 🔄 **Complete Workflows**: End-to-end transaction examples

## 📡 Event Streaming Examples

### 6. Bonding Curve Indexer (`stream/curve_indexer.ts`)

Historical bonding curve event analysis with enhanced features.

```bash
# Fetch all bonding curve events
bun run example:curve-indexer -- --rpc-url https://testnet.monad.xyz

# WebSocket support (NEW)
bun run example:curve-indexer -- --rpc-url wss://testnet.monad.xyz

# Filter by specific tokens
bun run example:curve-indexer -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Specific block range
bun run example:curve-indexer -- --from-block 1000000 --to-block latest
```

**Features:**

- 📊 **Historical Data**: Fetch events from specific block ranges
- 🎯 **Event Filtering**: Create, Buy, Sell, Sync, Lock, Listed events
- 🔄 **Batch Processing**: Automatic pagination with fetchAllEvents (NEW)
- 📈 **Statistics**: Event counts and analysis
- 🪙 **Token Filtering**: Focus on specific token addresses
- 🌐 **WebSocket Support**: Use WSS for better performance (NEW)

### 7. Bonding Curve Stream (`stream/curve_stream.ts`)

Live bonding curve event monitoring with real-time processing.

```bash
# Monitor all bonding curve events
bun run example:curve-stream -- --rpc-url https://testnet.monad.xyz

# Filter specific event types
EVENTS=Buy,Sell bun run example:curve-stream -- --rpc-url https://testnet.monad.xyz

# Filter specific tokens
bun run example:curve-stream -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Combined filtering (events AND tokens)
EVENTS=Buy,Sell bun run example:curve-stream -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1
```

**Features:**

- ⚡ **Real-time Processing**: RPC polling-based event delivery
- 🎯 **Flexible Filtering**: Event types and token address filtering
- 🔄 **All Event Types**: Create, Buy, Sell, Sync, Lock, Listed support
- 📊 **Live Statistics**: Real-time event analysis and metrics
- 🛡️ **Error Handling**: Robust connection management with auto-reconnect

### 8. DEX Indexer (`stream/dex_indexer.ts`)

Historical DEX swap event analysis with simplified API.

```bash
# Discover pools and fetch historical swaps
bun run example:dex-indexer -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# WebSocket support (NEW)
bun run example:dex-indexer -- --rpc-url wss://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Batch process with JSON array format
bun run example:dex-indexer -- --rpc-url https://testnet.monad.xyz --tokens '["0xToken1","0xToken2"]'
```

**Features:**

- 🔍 **Automatic Pool Discovery**: Finds Uniswap V3 pools for tokens
- 📊 **Swap Event Analysis**: Detailed swap data
- 🔄 **Batch Processing**: Automatic pagination with fetchAllEvents (NEW)
- 📈 **Simplified API**: Direct RPC URL usage (NEW)
- 🌐 **WebSocket Support**: Use WSS for better performance (NEW)

### 9. DEX Stream (`stream/dex_stream.ts`)

Real-time DEX swap monitoring with pool discovery.

```bash
# Monitor specific pools
POOLS=0xPool1,0xPool2 bun run example:dex-stream -- --rpc-url https://testnet.monad.xyz

# Auto-discover pools for tokens
bun run example:dex-stream -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Single token pool discovery
bun run example:dex-stream -- --rpc-url https://testnet.monad.xyz --token 0xTokenAddress
```

**Features:**

- ⚡ **Real-time Swap Events**: Live Uniswap V3 swap monitoring
- 🔍 **Pool Discovery**: Automatic pool detection for tokens
- 📊 **Pool Metadata**: Detailed pool information included
- 🛡️ **Connection Management**: Automatic reconnection logic

## ⛽ Gas Management (v0.2.2)

All trading examples use the new unified gas estimation system:

### Unified Gas Estimation

```typescript
import { Trade, type GasEstimationParams } from '@nadfun/sdk'

const trade = new Trade(rpcUrl, privateKey)

// Create gas estimation parameters
const gasParams: GasEstimationParams = {
  type: 'buy', // or 'sell', 'sellPermit'
  token,
  amountIn,
  amountOutMin,
  to: trade.account.address,
  deadline: 9999999999999999n,
}

// Get real-time estimation
const estimatedGas = await trade.estimateGas(router, gasParams)

// Apply buffer strategy
const gasWithBuffer = (estimatedGas * 120n) / 100n // 20% buffer
```

### Buffer Strategies

```typescript
// Fixed buffer
const gasFixed = estimatedGas + 50_000n

// Percentage buffers
const gas20Percent = (estimatedGas * 120n) / 100n // 20% buffer
const gas25Percent = (estimatedGas * 125n) / 100n // 25% buffer

// Operation-specific buffers
const finalGas = (() => {
  switch (operationType) {
    case 'buy':
      return (estimatedGas * 120n) / 100n // 20%
    case 'sell':
      return (estimatedGas * 115n) / 100n // 15%
    case 'sellPermit':
      return (estimatedGas * 125n) / 100n // 25%
    default:
      return estimatedGas + 50_000n
  }
})()
```

## 🚀 Configuration

### Environment Variables

```bash
export RPC_URL="https://testnet.monad.xyz"
export PRIVATE_KEY="0x..."
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"  # Multiple tokens
export RECIPIENT="0xRecipientAddress"
```

### CLI Arguments

All examples support command line arguments:

```bash
--rpc-url <URL>      # RPC URL for operations
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Single token address
--tokens <ADDRS>     # Multiple tokens: 'addr1,addr2'
--recipient <ADDR>   # Recipient for transfers/allowances
--amount <NUMBER>    # Amount for trading operations
--slippage <PERCENT> # Slippage tolerance (default: 5%)
--from-block <NUM>   # Starting block for indexing
--to-block <NUM>     # Ending block for indexing
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
bun install
# or
npm install
# or
yarn install
```

### 2. Build the SDK

```bash
bun run build
```

### 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
RPC_URL=https://testnet.monad.xyz
PRIVATE_KEY=0x...
TOKEN=0xTokenAddress
```

### 4. Run Examples

```bash
# Trading examples
bun run example:buy
bun run example:sell
bun run example:sell-permit
bun run example:gas-estimation

# Token operations
bun run example:token-utils

# Event streaming
bun run example:curve-indexer
bun run example:curve-stream
bun run example:dex-indexer
bun run example:dex-stream
```

## 🛡️ Safety Features

All examples include comprehensive safety measures:

- **Transaction Safety**: Execution commented out by default to prevent accidental trades
- **Slippage Protection**: Configurable tolerance with safe defaults
- **Balance Verification**: Checks before all operations
- **Gas Safeguards**: Intelligent estimation with buffers
- **Error Handling**: Comprehensive logging and recovery
- **Secure Configuration**: Environment variable isolation

## 🎯 Quick Start

### Simple Buy Example

```bash
# Set configuration
export PRIVATE_KEY="0x..."
export TOKEN="0xTokenAddress"

# Run with defaults (0.1 MON, 5% slippage)
bun run example:buy

# Customize amount and slippage
bun run examples/trade/buy.ts -- --amount 0.05 --slippage 3
```

### Token Analysis

```bash
# Get comprehensive token information
bun run example:token-utils -- --token 0xTokenAddress
```

### Live Monitoring

```bash
# Monitor all trading activity
bun run example:curve-stream

# Focus on specific tokens
bun run example:curve-stream -- --tokens 0xToken1,0xToken2
```

## 📚 Advanced Usage

### Custom Trading with Gas Estimation

```typescript
import { Trade, calculateMinAmountOut } from '@nadfun/sdk'

const trade = new Trade(rpcUrl, privateKey)

// Get quote
const { router, amount } = await trade.getAmountOut(token, amountIn, true)

// Calculate slippage
const minAmountOut = calculateMinAmountOut(amount, 5.0) // 5% slippage

// Estimate gas
const gasParams = {
  type: 'buy' as const,
  token,
  amountIn,
  amountOutMin: minAmountOut,
  to: trade.account.address,
  deadline: 9999999999999999n,
}

const estimatedGas = await trade.estimateGas(router, gasParams)
const gasLimit = (estimatedGas * 120n) / 100n // 20% buffer

// Execute trade
const result = await trade.buy(
  {
    token,
    amountIn,
    amountOutMin: minAmountOut,
    to: trade.account.address,
    deadline: 9999999999999999n,
    gasLimit,
  },
  router
)
```

### Event Processing Pipeline

```typescript
import { CurveIndexer, CurveEventType } from '@nadfun/sdk'

// Create indexer with simplified API (NEW)
const indexer = new CurveIndexer('https://your-rpc-endpoint')
// or use WebSocket for better performance
const indexer = new CurveIndexer('wss://your-websocket-endpoint')

// Fetch and process events
const events = await indexer.fetchEvents(
  1000000,
  1100000,
  [CurveEventType.Buy, CurveEventType.Sell],
  ['0xToken1', '0xToken2'] // Optional token filter
)

// Batch fetch with automatic pagination (NEW)
const allEvents = await indexer.fetchAllEvents(
  1000000,
  2000, // batch size
  [CurveEventType.Buy, CurveEventType.Sell]
)

// Process events
for (const event of events) {
  if (event.type === 'Buy') {
    console.log(`Buy: ${event.amountIn} → ${event.amountOut}`)
  }
}
```

## 🎉 Next Steps

1. **Explore Examples**: Run each example to understand SDK capabilities
2. **Customize Parameters**: Modify amounts, addresses, and filters
3. **Enable Real Trading**: Uncomment execution blocks when ready
4. **Build Your Application**: Use examples as building blocks

## 📞 Support

- Review the [main SDK documentation](../README.md)
- Check example output for debugging information
- Test on small amounts first
- Monitor transactions on [Monad Testnet Explorer](https://explorer.testnet.monad.xyz)

## ⚠️ Important Notes

- These examples are for educational purposes
- Always test thoroughly on testnet before using real funds
- Start with small amounts and verify all parameters
- Transaction execution is commented out by default for safety

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details.
