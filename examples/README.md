# NADS Pump SDK Examples

This directory contains comprehensive examples demonstrating how to use the NADS Pump SDK for trading, token operations, and real-time event streaming.

## 💰 Trading Examples

### 1. Buy Tokens (`trade/buy.ts`)

Buy tokens with MON including advanced gas management and slippage protection.

```bash
# Using environment variables
export PRIVATE_KEY="your_private_key_here"
export RPC_URL="https://testnet.monad.xyz"
export TOKEN="0xTokenAddress"
npm run example:buy

# Using command line arguments
npm run example:buy -- --private-key your_private_key_here --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 0.1
```

**Features:**

- ⛽ **Smart Gas Management**: Real-time estimation vs default gas limits comparison
- 🔄 **Automatic Router Detection**: Bonding curve vs DEX routing
- 🛡️ **Slippage Protection**: 5% default with customizable `amount_out_min`
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

### 2. Sell Tokens (`trade/sell.ts`)

Sell tokens for MON with automatic approval and intelligent gas optimization.

```bash
npm run example:sell -- --private-key your_private_key_here --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 100
```

**Features:**

- 🔍 **Token Balance Verification**: Ensures sufficient token balance
- 📋 **Automatic Approval Handling**: Checks allowance and approves if needed
- ⛽ **Dynamic Gas Estimation**: Real-time gas estimation with safe defaults
- 🛡️ **Slippage Protection**: Configurable slippage tolerance
- 🔄 **Two-step Process**: Approve → Sell workflow
- 📊 **Gas Comparison**: Shows estimated vs default gas limits

### 3. Gasless Sell (`trade/sell_permit.ts`)

Advanced gasless selling using EIP-2612 permit signatures.

```bash
npm run example:sell-permit -- --private-key your_private_key_here --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --amount 100
```

**Features:**

- 🔐 **EIP-2612 Permit Signatures**: Cryptographic gasless approvals
- ⚡ **One Transaction**: Combined approval + sell in single tx
- ⛽ **Optimized Gas**: Higher gas limits for complex permit transactions
- 🛡️ **Security**: Proper nonce and deadline management
- 📝 **Signature Details**: v, r, s component logging for transparency

## 🪙 Token Helper Examples

### 4. Basic ERC20 Operations (`token/basic_operations.ts`)

Comprehensive ERC20 token interaction patterns.

```bash
npm run example:basic-ops -- --private-key your_private_key_here --rpc-url https://testnet.monad.xyz --token 0xTokenAddress --recipient 0xRecipientAddress
```

**Features:**

- 📊 **Token Metadata**: Name, symbol, decimals, total supply retrieval
- 💰 **Balance Operations**: Check balances for any address
- 📝 **Allowance Management**: Check and set token approvals
- 💸 **Token Transfers**: Safe token transfer operations
- 🔄 **Complete Workflows**: End-to-end transaction examples

## 📡 Event Streaming Examples

### 5. Bonding Curve Event Indexing (`stream/curve_indexer.ts`)

Historical bonding curve event analysis with batch processing.

```bash
# Fetch all bonding curve events
npm run example:curve-indexer -- --rpc-url https://testnet.monad.xyz

# Filter by specific tokens
npm run example:curve-indexer -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Specific block range
npm run example:curve-indexer -- --from-block 1000000 --to-block latest
```

**Features:**

- 📊 **Historical Data**: Fetch events from specific block ranges
- 🎯 **Event Filtering**: Create, Buy, Sell, Sync, Lock, Listed events
- 🔄 **Batch Processing**: Efficient handling of large datasets
- 📈 **Statistics**: Event counts and analysis
- 🪙 **Token Filtering**: Focus on specific token addresses

### 6. Real-time Bonding Curve Streaming (`stream/curve_stream.ts`)

Live bonding curve event monitoring with real-time processing.

```bash
# Monitor all bonding curve events
npm run example:curve-stream -- --rpc-url https://testnet.monad.xyz

# Filter specific event types
EVENTS=Buy,Sell npm run example:curve-stream -- --rpc-url https://testnet.monad.xyz

# Filter specific tokens
npm run example:curve-stream -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1,0xToken2

# Combined filtering (events AND tokens)
EVENTS=Buy,Sell npm run example:curve-stream -- --rpc-url https://testnet.monad.xyz --tokens 0xToken1
```

**Features:**

- ⚡ **Real-time Processing**: Polling-based low-latency event delivery
- 🎯 **Flexible Filtering**: Event types and token address filtering
- 🔄 **All Event Types**: Create, Buy, Sell, Sync, Lock, Listed support
- 📊 **Live Statistics**: Real-time event analysis and metrics
- 🛡️ **Error Handling**: Robust connection management

## ⛽ Gas Management Features

All trading examples include intelligent gas management:

### Default Gas Limits (Based on Contract Testing)

- **Bonding Curve**: Buy: 320k, Sell: 170k, SellPermit: 210k
- **DEX Router**: Buy: 350k, Sell: 200k, SellPermit: 250k
- **Safety Buffer**: All limits include 20% buffer from forge test data

### Dynamic Gas Features

- **Real-time Estimation**: Actual contract call gas estimation
- **Network Price Detection**: Current gas price with EIP-1559 optimization
- **Comparison Output**: Shows estimated vs default gas limits
- **Custom Strategies**: Users can choose estimation, defaults, or custom values

**Example Usage:**

```typescript
import { Trade, GasConfig } from '@nadfun/sdk'

// Use safe defaults (recommended)
const trade = new Trade(rpcUrl, privateKey)

// Or customize gas configuration
const customGasConfig: GasConfig = {
  bondingRouter: {
    buy: BigInt(250000),
    sell: BigInt(300000),
  },
}
const trade = new Trade(rpcUrl, privateKey, customGasConfig)
```

## 🚀 Configuration

### Environment Variables

```bash
export RPC_URL="https://testnet.monad.xyz"
export PRIVATE_KEY="your_private_key_here"
export TOKEN="0xTokenAddress"
export TOKENS="0xToken1,0xToken2"
export RECIPIENT="0xRecipientAddress"
```

### CLI Arguments

All examples support command line arguments:

```bash
--rpc-url <URL>      # RPC URL for HTTP operations
--private-key <KEY>  # Private key for transactions
--token <ADDRESS>    # Single token address
--tokens <ADDRS>     # Multiple tokens: 'addr1,addr2'
--recipient <ADDR>   # Recipient for transfers/allowances
--amount <NUMBER>    # Amount for trading operations
--slippage <PERCENT> # Slippage tolerance (default: 5%)
```

## 🔧 Setup Instructions

1. **Install Dependencies**

```bash
npm install
# or
yarn install
```

2. **Build the SDK**

```bash
npm run build
```

3. **Configure Environment**

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
RPC_URL=https://testnet.monad.xyz
PRIVATE_KEY=0x1234567890abcdef...
TOKEN=0xTokenAddress
```

4. **Run Examples**

```bash
# Trading examples
npm run example:buy
npm run example:sell
npm run example:sell-permit

# Token operations
npm run example:basic-ops

# Event streaming
npm run example:curve-indexer
npm run example:curve-stream
```

## 🛡️ Safety Features

All examples include comprehensive safety measures:

- **Transaction execution is commented out by default** to prevent accidental trades
- **Slippage protection** with configurable tolerance
- **Balance verification** before all operations
- **Gas limit safeguards** with intelligent estimation
- **Comprehensive error handling** with detailed logging
- **Environment variable isolation** for secure configuration

## 🎯 Quick Start

1. **Simple Buy Example**

```bash
# Set your configuration
export PRIVATE_KEY="0x1234..."
export TOKEN="0xTokenAddress"

# Run with default settings (0.1 MON, 5% slippage)
npm run example:buy

# Customize amount and slippage
npm run example:buy -- --amount 0.05 --slippage 3
```

2. **Token Analysis**

```bash
# Get comprehensive token information
npm run example:basic-ops -- --token 0xTokenAddress
```

3. **Live Monitoring**

```bash
# Monitor all trading activity
npm run example:curve-stream

# Focus on specific tokens
npm run example:curve-stream -- --tokens 0xToken1,0xToken2
```

## 📚 Advanced Usage

### Custom Gas Configuration

```typescript
import { Trade } from '@nadfun/sdk'

const customGasConfig = {
  bondingRouter: {
    buy: BigInt(250000),
    sell: BigInt(180000),
    sellPermit: BigInt(220000),
  },
  dexRouter: {
    buy: BigInt(380000),
    sell: BigInt(220000),
    sellPermit: BigInt(280000),
  },
}

const trade = new Trade(rpcUrl, privateKey, customGasConfig)
```

### Event Processing Pipeline

```typescript
import { CurveIndexer } from '@nadfun/sdk'

// Create indexer
const indexer = new CurveIndexer(client)

// Apply filters
indexer.filterTokens(['0xToken1', '0xToken2'])
indexer.subscribeEvents([EventType.Buy, EventType.Sell])

// Fetch and process
const events = await indexer.getHistoricalEvents(BigInt(1000000), 'latest')

// Process events
for (const event of events) {
  if (event.eventType === EventType.Buy) {
    // Handle buy event
  }
}
```

## 🎉 Next Steps

1. **Explore the Examples**: Run each example to understand the SDK capabilities
2. **Customize Parameters**: Modify amounts, addresses, and filters for your use case
3. **Enable Real Trading**: Uncomment execution blocks when ready for live trading
4. **Build Your Application**: Use these examples as building blocks for your project

## 📞 Support

- Review the main SDK documentation
- Check example output for debugging information
- Test on small amounts first
- Monitor transactions on [Monad Testnet Explorer](https://testnet.monad.xyz)

---

**⚠️ Important**: These examples are for educational purposes. Always test thoroughly on testnet before using real funds. Start with small amounts and verify all parameters before executing transactions.
