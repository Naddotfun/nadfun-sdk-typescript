# Nad.fun SDK Examples

This directory contains comprehensive examples demonstrating how to use the Nad.fun SDK for trading, token operations, and real-time event streaming.

## 💰 Trading Examples

### 1. Buy Tokens (`trade/buy.ts`)

Buy tokens with MON including advanced gas management and slippage protection.

```bash
# Using environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://your-rpc-endpoint"
export TOKEN="0xTokenAddress"
bun run example:buy

# Using command line arguments
bun run example:buy -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- ⛽ **Smart Gas Management**: Real-time estimation vs default gas limits comparison
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
⛽ Estimated gas for buy contract call: 245123
⛽ Using default gas limit: 320000
🛡️ Slippage protection:
  Expected tokens: 1234567890123456789
  Minimum tokens (5% slippage): 1172839745617283950
✅ Buy successful!
  Transaction hash: 0x...
  Gas used: 247891
```

### 2. Gas Estimation (`trade/gas_estimation.ts`)

Comprehensive gas estimation example for all trading operations with automatic problem solving.

```bash
bun run example:gas-estimation -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- ⛽ **Unified Gas Estimation**: Uses `trade.estimateGas()` for BUY, SELL, and SELL PERMIT operations
- 🔧 **Automatic Problem Solving**: Handles token approval and EIP-2612 permit signatures automatically
- 📊 **Buffer Strategies**: Demonstrates different buffer calculation methods (fixed +50k, percentage 20%-25%)
- 💰 **Cost Analysis**: Shows estimated transaction costs at different gas prices
- ⚠️ **Real Network Conditions**: Uses actual network estimation with proper error handling

**Important Requirements:**

- **Token Approval**: SELL operations require approval (automatically handled)
- **Permit Signatures**: SELL PERMIT needs valid signatures (automatically generated)
- **Network Connection**: Live RPC required for accurate estimation

### 3. Sell Tokens (`trade/sell.ts`)

Sell tokens for MON with automatic approval and intelligent gas optimization.

```bash
bun run example:sell -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- 🔍 **Token Balance Verification**: Ensures sufficient token balance
- 📋 **Automatic Approval Handling**: Checks allowance and approves if needed
- ⛽ **Dynamic Gas Estimation**: Real-time gas estimation with safe defaults
- 🛡️ **Slippage Protection**: Configurable slippage tolerance
- 🔄 **Two-step Process**: Approve → Sell workflow
- 📊 **Gas Comparison**: Shows estimated vs default gas limits

### 4. Gasless Sell (`trade/sell_permit.ts`)

Advanced gasless selling using EIP-2612 permit signatures.

```bash
bun run example:sell-permit -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- 🔐 **EIP-2612 Permit Signatures**: Cryptographic gasless approvals
- ⚡ **One Transaction**: Combined approval + sell in single tx
- ⛽ **Optimized Gas**: Higher gas limits for complex permit transactions
- 🛡️ **Security**: Proper nonce and deadline management
- 📝 **Signature Details**: v, r, s component logging for transparency

## 🪙 Token Helper Examples

### 5. Basic ERC20 Operations (`token/basic_operations.ts`)

Comprehensive ERC20 token interaction patterns.

```bash
bun run example:basic-operations -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress --recipient 0xRecipientAddress
```

**Features:**

- 📊 **Token Metadata**: Name, symbol, decimals, total supply retrieval
- 💰 **Balance Operations**: Check balances for any address
- 📝 **Allowance Management**: Check and set token approvals
- 💸 **Token Transfers**: Safe token transfer operations
- 🔄 **Complete Workflows**: End-to-end transaction examples

### 6. EIP-2612 Permit Signatures (`token/permit_signature.ts`)

Master gasless approvals with cryptographic permit signatures.

```bash
bun run example:permit-signature -- --private-key your_private_key_here --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- 🔐 **Permit Signature Generation**: EIP-2612 compliant signatures
- 📊 **Nonce Management**: Account nonce tracking and management
- 🔍 **Signature Components**: Detailed v, r, s breakdown
- 🛡️ **Security Best Practices**: Deadline and nonce validation

## 📡 Event Streaming Examples

### 7. Bonding Curve Event Indexing (`stream/curve_indexer.ts`)

Historical bonding curve event analysis with batch processing.

```bash
# Fetch all bonding curve events
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint

# Filter by specific tokens
bun run example:curve-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2
```

**Features:**

- 📊 **Historical Data**: Fetch events from specific block ranges
- 🎯 **Event Filtering**: Create, Buy, Sell, Sync, Lock, Listed events
- 🔄 **Batch Processing**: Efficient handling of large datasets
- 📈 **Statistics**: Event counts and analysis
- 🪙 **Token Filtering**: Focus on specific token addresses

### 8. Real-time Bonding Curve Streaming (`stream/curve_stream.ts`)

Live bonding curve event monitoring with WebSocket streaming.

```bash
# Monitor all bonding curve events
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint

# Filter specific event types
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --events Buy,Sell

# Filter specific tokens
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --tokens 0xToken1,0xToken2

# Combined filtering (events AND tokens)
bun run example:curve-stream -- --ws-url wss://your-ws-endpoint --events Buy,Sell --tokens 0xToken1
```

**Features:**

- ⚡ **Real-time Streaming**: WebSocket-based low-latency event delivery
- 🎯 **Flexible Filtering**: Event types and token address filtering
- 🔄 **All Event Types**: Create, Buy, Sell, Sync, Lock, Listed support
- 📊 **Live Processing**: Immediate event handling and analysis
- 🛡️ **Error Handling**: Robust connection management

### 9. DEX Event Indexing (`stream/dex_indexer.ts`)

Historical Uniswap V3 swap event analysis with pool discovery.

```bash
# Auto-discover pools and fetch swap events
bun run example:dex-indexer -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2

# Use specific pool addresses
bun run example:dex-indexer -- --rpc-url https://your-rpc-endpoint --pools 0xPool1,0xPool2
```

**Features:**

- 🔍 **Automatic Pool Discovery**: Find Uniswap V3 pools for tokens
- 📊 **Swap Event Analysis**: Complete swap transaction details
- 🏊 **Pool Metadata**: Pool addresses, fee tiers, token pairs
- 📈 **Historical Data**: Configurable block range processing
- 🎯 **Token-specific**: Focus on specific token trading activity

### 10. Real-time DEX Streaming (`stream/dex_stream.ts`)

Live Uniswap V3 swap monitoring with pool auto-discovery.

```bash
# Monitor specific pools directly
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --pools 0xPool1,0xPool2

# Auto-discover pools for tokens
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --tokens 0xToken1,0xToken2

# Single token monitoring
bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --token 0xTokenAddress
```

**Features:**

- 🔍 **Pool Auto-discovery**: Automatic Uniswap V3 pool detection
- ⚡ **Real-time Swaps**: Live swap event monitoring
- 🏊 **Pool Metadata**: Complete pool information included
- 📊 **Swap Details**: amount0, amount1, sender, recipient, tick data
- 🎯 **Flexible Targeting**: Pool addresses or token-based discovery

### 11. Pool Discovery (`stream/pool_discovery.ts`)

Automated Uniswap V3 pool address discovery utility.

```bash
# Discover pools for multiple tokens
bun run example:pool-discovery -- --rpc-url https://your-rpc-endpoint --tokens 0xToken1,0xToken2

# Single token discovery
bun run example:pool-discovery -- --rpc-url https://your-rpc-endpoint --token 0xTokenAddress
```

**Features:**

- 🔍 **Comprehensive Discovery**: Find all Uniswap V3 pools for tokens
- 🏊 **Pool Information**: Addresses, fee tiers, token pairs
- 📊 **Multiple Tokens**: Batch discovery for token lists
- 🎯 **Targeted Search**: Single token or multi-token discovery
- 📝 **Detailed Output**: Complete pool metadata reporting

## ⛽ Gas Management Features

All trading examples now use the new unified gas estimation system:

### New Gas Estimation System

- **Real-time Network Estimation**: Uses `trade.estimateGas()` for live gas calculations
- **Automatic Problem Solving**: Handles token approval and permit signatures automatically
- **Network-based Calculation**: No more static fallback constants - all estimates from actual network conditions
- **Smart Buffer Strategies**: Multiple buffer calculation methods (fixed amounts, percentages)

### Gas Estimation Requirements

⚠️ **Important**: For accurate gas estimation, certain conditions must be met:

- **SELL Operations**: Require token approval for router (automatically handled in examples)
- **SELL PERMIT Operations**: Need valid EIP-2612 permit signatures (automatically generated in examples)
- **Token Balance**: Some token balance recommended for realistic estimation (examples use 1 token minimum)
- **Network Connection**: Live RPC connection required for real-time estimation

### Dynamic Gas Features

- **Real-time Estimation**: Actual contract call gas estimation using network conditions
- **Network Price Detection**: Current gas price with EIP-1559 optimization
- **Multiple Buffer Strategies**: Fixed amounts (+50k) and percentage-based (20%, 25%)
- **Cost Analysis**: Transaction cost estimates at different gas prices
- **Error Handling**: Graceful fallback when estimation fails

**Example Usage:**

```typescript
import { Trade, type GasEstimationParams } from '@nadfun/sdk'

// Unified gas estimation for any operation
const gasParams: GasEstimationParams = {
  type: 'buy', // or 'sell', 'sellPermit'
  token,
  amountIn,
  amountOutMin,
  to,
  deadline,
}
const estimatedGas = await trade.estimateGas(router, gasParams)

// Apply buffer strategy
const gasWithBuffer = (estimatedGas * 120n) / 100n // 20% buffer
```

## 🚀 Configuration

### Environment Variables

```bash
export RPC_URL="https://your-rpc-endpoint"
export WS_RPC_URL="wss://your-ws-endpoint"
export PRIVATE_KEY="your_private_key_here"
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"
export POOLS="0xPool1,0xPool2"
export RECIPIENT="0xRecipientAddress"
export EVENTS="Buy,Sell,Create"
```

### CLI Arguments

All examples support command line arguments:

```bash
--rpc-url <URL>      # RPC URL for HTTP operations
--ws-url <URL>       # WebSocket URL for streaming
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Single token address
--tokens <ADDRS>     # Multiple tokens: 'addr1,addr2'
--pools <ADDRS>      # Pool addresses: 'pool1,pool2'
--recipient <ADDR>   # Recipient for transfers/allowances
--events <TYPES>     # Event types: 'Buy,Sell,Create'
```

## 📊 Key Features Demonstrated

### Smart Gas Management

- **Real-time vs Defaults**: Compare estimated gas with safe defaults
- **Network Optimization**: EIP-1559 compatible gas pricing
- **Router-specific**: Different limits for bonding curve vs DEX operations
- **Buffer Strategies**: 20% safety buffers with customization options

### Event Processing

- **Real-time Streaming**: WebSocket-based low-latency delivery
- **Historical Indexing**: Batch processing for analysis
- **Flexible Filtering**: Event types and token address filtering
- **Pool Discovery**: Automatic Uniswap V3 pool detection

### Transaction Management

- **Slippage Protection**: Configurable tolerance levels
- **Approval Handling**: Automatic allowance checking and approval
- **Permit Signatures**: Gasless EIP-2612 approvals
- **Result Verification**: Complete transaction status validation

## 💡 Best Practices

- **Start with Trading**: Begin with buy/sell examples to understand gas management
- **Use Defaults First**: Default gas limits are tested and safe
- **Monitor Network**: Check gas prices during high activity
- **Test with Small Amounts**: Verify functionality before large transactions
- **Handle Errors**: All examples include proper error handling patterns
- **Secure Keys**: Never commit private keys to version control [[memory:6682149]]

## 🔧 Development Tips

- **HTTP for Indexing**: More reliable for historical data fetching
- **WebSocket for Streaming**: Lower latency for real-time monitoring
- **Parallel Processing**: Large datasets benefit from concurrent processing
- **Rate Limiting**: Monitor RPC provider limits and implement backoff
- **Local Caching**: Store frequently accessed data to reduce API calls

## 📚 Additional Resources

- [Stream API Documentation](./stream/README.md)
- [Type Definitions](../src/types/)
- [Main SDK Documentation](../README.md)
