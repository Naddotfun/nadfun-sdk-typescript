# 🎉 Nad.fun TypeScript SDK v0.1.0

**Release Date**: 2025-08-19  
**Initial Release**: Complete TypeScript SDK for Nad.fun ecosystem

## 📦 Installation

```bash
bun add @nadfun/sdk
# or
npm install @nadfun/sdk
```

## ✨ Major Features

### 🚀 **Trading Operations**

- **Buy/Sell Operations**: Execute trades on bonding curves with slippage protection
- **EIP-2612 Permit Support**: Gasless selling with permit signatures (sellPermit)
- **Intelligent Gas Management**: Optimized gas limits based on forge test data
  - Bonding Curve: Buy (320k), Sell (170k), SellPermit (210k)
  - DEX Router: Buy (350k), Sell (200k), SellPermit (250k)
- **Automatic Router Detection**: Smart routing between bonding curve and DEX

### 📊 **Token Utilities**

- **Token Metadata**: Get name, symbol, decimals, total supply
- **Balance & Allowance**: Check token balances and allowances
- **Smart Approval**: Intelligent approval management with existing allowance checks
- **Formatted Output**: Built-in formatting utilities for human-readable displays

### 🔄 **Real-time Event Streaming**

- **Bonding Curve Events**: Stream Create, Buy, Sell, Sync, Lock, Listed events
- **DEX Swap Events**: Monitor Uniswap V3 swap events in real-time
- **WebSocket Support**: Efficient real-time streaming with auto-reconnection
- **Event Filtering**: Filter by tokens and event types
- **Connection Stability**: Robust error handling and reconnection logic

### 🔍 **Pool Discovery** ⭐ **NEW**

- **Automatic Pool Detection**: Find Uniswap V3 pools for any token
- **WMON Pairing**: Automatically discover Token-WMON pairs
- **NADS Fee Tier**: Uses standard 1% (10,000) fee tier
- **V3 Factory Integration**: Direct integration with Uniswap V3 Factory contract
- **Both Stream & Indexer**: Available for both real-time and historical analysis

### 📈 **Historical Data Analysis**

- **Block Range Processing**: Fetch historical events with automatic batching
- **RPC Limit Handling**: Smart batching respects 100-block official RPC limits
- **Chronological Sorting**: Events returned in chronological order
- **Memory Efficient**: Stream-based processing without buffering

## 🛠 **Technical Excellence**

### 💪 **TypeScript First**

- **Full Type Safety**: Complete TypeScript definitions for all APIs
- **Modern ES2023**: Built with latest JavaScript features
- **Dual Module**: ESM and CJS support with proper exports
- **Tree Shaking**: Optimized bundle sizes with selective imports

### ⚡ **Performance & Reliability**

- **Intelligent Batching**: Automatic request batching for large data sets
- **Error Recovery**: Graceful error handling with descriptive messages
- **Network Resilience**: Built-in retry logic and connection management
- **Memory Efficient**: Stream-based architecture prevents memory leaks

### 🔐 **Security & Best Practices**

- **Mock Private Keys**: All examples use safe placeholder keys
- **Environment Variable Support**: Secure configuration management
- **Permit Signatures**: EIP-2612 gasless transaction support
- **Address Validation**: Built-in address format validation

## 📚 **Comprehensive Examples**

### 🏪 **Trading Examples**

```bash
bun run example:buy              # Buy tokens with gas optimization
bun run example:sell             # Sell tokens with approval handling
bun run example:sell-permit      # Gasless sell with EIP-2612 permits
```

### 🔄 **Streaming Examples**

```bash
# Bonding curve events
bun run example:curve-stream -- --token 0xTokenAddress
bun run example:curve-indexer -- --from-block 18000000

# DEX swap events with auto pool discovery
bun run example:dex-stream -- --token 0x...
bun run example:dex-stream -- --tokens 0xToken1,0xToken2
bun run example:dex-stream -- --pools 0xPool1,0xPool2
```

### 💼 **Utility Examples**

```bash
bun run example:basic-ops        # Token operations and metadata
bun run example:gas-estimator    # Gas analysis and optimization
```

## 🔧 **Configuration**

### **Contract Addresses** (Monad Testnet)

```typescript
const CONTRACTS = {
  DEX_ROUTER: '0x4FBDC27FAE5f99E7B09590bEc8Bf20481FCf9551',
  BONDING_CURVE_ROUTER: '0x4F5A3518F082275edf59026f72B66AC2838c0414',
  LENS: '0xD47Dd1a82dd239688ECE1BA94D86f3D32960C339',
  CURVE: '0x52D34d8536350Cd997bCBD0b9E9d722452f341F5',
  WMON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  V3_FACTORY: '0x961235a9020B05C44DF1026D956D1F4D78014276',
}
```

### **Environment Variables**

```bash
RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_private_key_here
WS_URL=wss://testnet-ws.monad.xyz
TOKEN=0xTokenAddress
```

## 📋 **Package Details**

- **Package Size**: 106.2 KB compressed, 680.5 KB unpacked
- **Total Files**: 45 files including examples and documentation
- **Node.js**: Requires Node.js >=18.0.0
- **License**: MIT License
- **Dependencies**: Only `viem ^2.34.0` (minimal footprint)

## 🚀 **Quick Start**

```typescript
import { Trade, Token, parseEther, formatEther } from '@nadfun/sdk'

const trade = new Trade(rpcUrl, privateKey)
const token = new Token(rpcUrl, privateKey)

// Get quote and execute buy
const { router, amount } = await trade.getAmountOut(tokenAddress, parseEther('0.1'), true)

// Execute purchase
const txHash = await trade.buy(
  {
    token: tokenAddress,
    amountIn: parseEther('0.1'),
    amountOutMin: (amount * 95n) / 100n, // 5% slippage
    to: trade.address,
    deadline: Math.floor(Date.now() / 1000) + 300,
  },
  router
)
```

## 🧪 **Verified & Tested**

✅ **Pool Discovery**: Tested with DEX token `0xe622377AaB9C22eA5Fd2622899fF3c060eA27F53`  
✅ **EIP-2612 Permits**: Gasless transactions working perfectly  
✅ **Real-time Streaming**: WebSocket connections stable and performant  
✅ **Gas Optimization**: All gas limits verified with forge tests  
✅ **Cross-platform**: Works with bun, npm, yarn, pnpm

## 🔗 **Links**

- **Repository**: https://github.com/Naddotfun/nadfun-sdk-typescript
- **Documentation**: See README.md and examples/
- **Issues**: https://github.com/Naddotfun/nadfun-sdk-typescript/issues

## 🎯 **What's Next**

This initial release provides a complete foundation for building applications on the Nad.fun ecosystem. Future releases will focus on:

- Advanced analytics and charting utilities
- Additional chain support beyond Monad Testnet
- Performance optimizations and caching
- Enhanced developer tooling

---

**Full Changelog**: https://github.com/Naddotfun/nadfun-sdk-typescript/commits/v0.1.0

## 💡 **Getting Help**

- 📖 **Examples**: Check the `examples/` directory for comprehensive usage examples
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💬 **Discussions**: Use GitHub Discussions for questions and feedback

**Made with ❤️ by the Nad.fun Team**
