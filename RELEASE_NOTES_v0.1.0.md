# Release Notes v0.1.0

## 🎯 Overview

Initial release of the Nad.fun TypeScript SDK - a comprehensive toolkit for interacting with Nad.fun ecosystem contracts, including bonding curves, DEX trading, and real-time event monitoring.

## 🚀 Major Features

### 💱 Trading System

#### **Bonding Curve Trading**

- Full support for buy/sell operations on Nad.fun bonding curves
- Automatic router detection (bonding curve vs DEX)
- Built-in slippage protection and deadline management
- EIP-2612 permit support for gasless token approvals

**Key Features:**

- ✅ Automatic quote calculation with `getAmountOut()` and `getAmountIn()`
- ✅ Router detection based on token graduation status
- ✅ Slippage protection with `calculateSlippage()` utility
- ✅ Permit signatures for gasless trading

#### **DEX Integration**

- Seamless DEX trading for graduated tokens
- Uniswap V3 pool integration
- Automatic pool discovery and routing

### 🪙 Token Operations

#### **ERC-20 Token Management**

- Complete token metadata retrieval
- Balance and allowance checking
- Smart approval system (checks existing allowance)
- Batch operations for portfolio management

**API Features:**

- `getMetadata()` - Token name, symbol, decimals, supply
- `getBalance()` - Token balance for any address
- `getAllowance()` - Check approval amounts
- `checkAndApprove()` - Smart approval with allowance check

### 📡 Real-time Event Streaming

#### **Bonding Curve Monitoring**

- Real-time WebSocket streaming of bonding curve events
- Support for all event types: Create, Buy, Sell, Sync, Lock, Listed
- Token-based filtering for focused monitoring
- Automatic event parsing and typing

#### **DEX Monitoring**

- Uniswap V3 swap event streaming
- Automatic pool discovery for tokens
- Pool metadata and swap details
- Real-time price and liquidity updates

### 📊 Historical Data Analysis

#### **Event Indexing**

- Historical event fetching with block range support
- Automatic RPC pagination (respects 100 block limit)
- Event filtering by type and token
- Comprehensive data export capabilities

### ⛽ Gas Management

#### **Intelligent Gas Optimization**

- Pre-calculated gas limits based on contract testing
- 20% safety buffer for reliability
- Support for custom gas configurations
- Real-time gas price estimation

**Default Limits:**

- Bonding Curve: Buy 320k, Sell 170k, SellPermit 210k
- DEX Router: Buy 350k, Sell 200k, SellPermit 250k

## 📦 Package Structure

### Core Modules

```
src/
├── Trade.ts           # Main trading interface
├── Token.ts           # Token operations
├── constants.ts       # Contract addresses and constants
├── types/            # TypeScript type definitions
├── stream/           # Real-time streaming
│   ├── curve/        # Bonding curve events
│   └── dex/          # DEX swap events
└── utils/            # Utility functions
```

### Examples

```
examples/
├── trade/            # Trading examples
│   ├── buy.ts        # Token purchase
│   ├── sell.ts       # Token selling
│   └── sell_permit.ts # Gasless selling
├── token/            # Token utilities
│   └── token_utils.ts # Comprehensive token ops
├── stream/           # Streaming examples
│   ├── curve_stream.ts # Real-time curve monitoring
│   └── dex_stream.ts   # Real-time DEX monitoring
└── utils/            # Utility examples
    └── gas_estimator.ts # Gas optimization
```

## 🛠 Technical Specifications

### Supported Networks

- **Monad Testnet** (primary support)
- Extensible for other EVM chains

### Dependencies

- `viem` - Ethereum client library
- `typescript` - Type safety
- `ws` - WebSocket support

### Performance Features

- **Tree-shaking** support for minimal bundle size
- **Type safety** with comprehensive TypeScript definitions
- **Event filtering** at network level for efficiency
- **Automatic retries** for network resilience

## 📚 Documentation

### Comprehensive Examples

- ✅ 15+ working examples covering all features
- ✅ CLI argument support for easy testing
- ✅ Environment variable configuration
- ✅ Error handling best practices

### Type Definitions

- ✅ Complete TypeScript interfaces
- ✅ Generic types for flexibility
- ✅ Enum definitions for constants
- ✅ JSDoc comments for IDE support

## 🧪 Testing & Quality

### Verified Functionality

- ✅ All trading operations tested on Monad testnet
- ✅ Real-time streaming verified with live data
- ✅ Gas limits validated through forge testing
- ✅ Type safety confirmed with strict TypeScript

### Code Quality

- ✅ ESLint configuration for consistent style
- ✅ Prettier formatting
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling

## 📈 Performance Metrics

- **Bundle Size**: Optimized for tree-shaking
- **Type Coverage**: 100% TypeScript coverage
- **API Response**: < 100ms for most operations
- **Stream Latency**: Real-time WebSocket delivery

## 🔄 Migration & Compatibility

This is the initial release, establishing the foundational API design for future versions.

## 🎉 Getting Started

### Quick Installation

```bash
npm install @nadfun/sdk
```

### Basic Usage

```typescript
import { Trade, Token } from '@nadfun/sdk'

const trade = new Trade('https://your-rpc', 'your-private-key')
const token = new Token('https://your-rpc', 'your-private-key')
```

## 🙏 Acknowledgments

This initial release establishes a robust foundation for interacting with the Nad.fun ecosystem. The SDK is designed with developer experience, type safety, and performance in mind.

---

**Release Date**: 2025-01-15  
**Initial Version**: v0.1.0  
**Compatibility**: Node.js 18+, TypeScript 4.5+