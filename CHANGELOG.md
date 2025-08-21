# Changelog

All notable changes to this project will be documented in this file.

## [0.2.3] - 2024-12-20

### 🎯 Enhanced Features

#### Token Module Improvements

- **New batch operations** - `batchGetBalances`, `batchGetMetadata`, `batchGetAllowances` for efficient multi-token queries
- **Token burning support** - Added `burn` and `burnFrom` methods for ERC20Burnable tokens
- **Token health checks** - New `getTokenHealth` method to validate token contracts
- **Contract validation** - Added `isContract` method to verify addresses
- **Individual getters** - New `getDecimals`, `getName`, `getSymbol`, `getTotalSupply` methods
- **Improved permit signatures** - Enhanced `generatePermitSignature` with better error handling

#### Stream Module Enhancements

- **WebSocket support** - Both HTTP and WebSocket connections now supported in indexers
- **Simplified APIs** - Direct RPC URL usage instead of requiring viem clients
- **Batch fetching** - New `fetchAllEvents` method with automatic pagination
- **Cleaner code** - Removed redundant code and improved maintainability

### 🔧 Code Quality Improvements

- **Reduced complexity** - Removed unnecessary abstractions in DEX indexer
- **Better error handling** - Improved error messages and fallback mechanisms
- **Performance optimizations** - More efficient batch processing
- **Type safety** - Enhanced TypeScript types throughout

### 📚 Documentation Updates

- **Updated README** - Added new features and improved examples
- **Enhanced examples** - Updated all examples to demonstrate new capabilities
- **Better organization** - Clearer structure and navigation

### 🐛 Bug Fixes

- Fixed WebSocket connection handling in indexers
- Improved error recovery in streaming modules
- Better handling of edge cases in token operations

### 📦 Dependencies

- No breaking dependency changes
- Version bump to 0.2.3

### 📝 Migration Guide

If upgrading from v0.2.2:

```typescript
// Old (v0.2.2)
import { Token } from '@nadfun/sdk'
const token = new Token(rpc, key)
// Limited to single operations

// New (v0.2.3)
import { Token } from '@nadfun/sdk'
const token = new Token(rpc, key)

// Batch operations for efficiency
const balances = await token.batchGetBalances([token1, token2, token3])
const metadata = await token.batchGetMetadata([token1, token2])

// Token health checks
const health = await token.getTokenHealth(tokenAddress)

// Burn operations
await token.burn(tokenAddress, amount)
```

## [0.2.2] - 2024-12-19

### 🔧 Breaking Changes

#### Stream Module Refactoring

- **Fixed curve indexer and stream modules** - Resolved critical issues in bonding curve event processing
- **Improved event parser** - Enhanced reliability and error handling for curve events
- **Simplified type definitions** - Streamlined `BondingCurveEvent` types for better type safety

### 📚 Documentation Overhaul

#### Complete README Restructuring

- **Removed v0.2.0 promotional content** - Cleaned up marketing-style content for cleaner documentation
- **Aligned with Rust SDK format** - Consistent documentation structure across all Nad.fun SDKs
- **Simplified navigation** - Removed complex table navigation in favor of standard sections

#### Fixed API References

- **Corrected class names**: `TokenHelper` → `Token` (matches actual implementation)
- **Fixed method names**:
  - `balanceOf` → `getBalance`
  - `allowance` → `getAllowance`
- **Updated import paths**: All exports now available from main `@nadfun/sdk` package
- **Fixed type names**: `EventType` → `CurveEventType` for bonding curve events

#### Updated Code Examples

- **Fixed trading examples**:
  - `trade.walletAddress` → `trade.account.address`
  - `getAmountOut` return: `{ router, amountOut }` → `{ router, amount }`
  - `SlippageUtils.calculateAmountOutMin` → `calculateMinAmountOut`
- **Removed WebSocket references**:
  - All streaming examples now use RPC endpoints
  - Removed `--ws-url` CLI arguments
  - Removed `WS_URL` environment variable

#### Package Manager Updates

- **Added Bun as primary option** - `bun add @nadfun/sdk` listed first
- **Updated all commands** - Changed from `npm run` to `bun run`
- **Script execution** - `npx tsx` → `bun run`

### 🐛 Bug Fixes

#### Curve Module Fixes (from commit 8ec58c8)

- Fixed critical issues in `curve_indexer.ts` and `curve_stream.ts`
- Resolved event parsing errors in curve module
- Improved error handling and reconnection logic
- Fixed type inconsistencies in `BondingCurveEvent` interface

#### Documentation Fixes

- Corrected all incorrect import statements
- Fixed method signatures to match implementation
- Updated gas estimation version references (v0.2.0 → v0.2.2)
- Removed references to non-existent utilities and methods

### 🔄 Refactoring (from commit 37a7bc7)

- **Types module** - Centralized and reorganized type definitions
- **Trading module** - Improved structure and error handling
- **Examples** - Updated all examples to use new type system
- **Removed custom gas logic** - Simplified gas estimation API

### 📦 Dependencies

- Updated to version 0.2.2
- No breaking dependency changes

### 📝 Migration Guide

If upgrading from v0.2.1:

```typescript
// Old (v0.2.1)
import { TokenHelper } from '@nadfun/sdk'
import { EventType } from '@nadfun/sdk/stream'
const helper = new TokenHelper(rpc, key)
const balance = await helper.balanceOf(token, address)

// New (v0.2.2)
import { Token, CurveEventType } from '@nadfun/sdk'
const helper = new Token(rpc, key)
const balance = await helper.getBalance(token, address)
```

## [0.2.1] - 2024-12-18

### Added

- Initial unified gas estimation system
- Stream modules for real-time event monitoring
- Comprehensive examples for trading and streaming

### Fixed

- Documentation improvements
- Example code corrections

## [0.2.0] - 2024-12-17

### Added

- Intelligent gas management system
- Automatic gas estimation
- Safety buffer configurations
- High-speed trading mode

### Changed

- Simplified trading API
- Removed manual gasLimit requirements
- Improved error handling

## [0.1.1] - 2024-12-16

### Added

- Slippage management utilities
- Token metadata helpers
- Pool discovery features

### Fixed

- Gas configuration issues
- Token utility undefined metadata

## [0.1.0] - 2024-12-15

### Added

- Initial release
- Core trading functionality
- Token operations
- Basic event streaming
- Contract interactions
