# GITHUB_RELEASE_NOTES

## v0.2.5 - Enhanced Examples and Documentation

### 🚀 Major Features

**Restructured Examples for Better Developer Experience**

- **Scenario-based Streaming**: Reorganized `curve_stream.ts` and `dex_stream.ts` with multiple scenarios (all events, filtered events, filtered tokens, combined)
- **Unified Example Structure**: All examples now follow consistent patterns matching Rust SDK structure
- **Enhanced Token Operations**: Split token utilities into `basic_operations.ts` and `permit_signature.ts` for clearer separation of concerns
- **Pool Discovery Example**: New `pool_discovery.ts` example for automated Uniswap V3 pool detection

### ✨ New Features

**Enhanced Streaming Examples**

- **Curve Stream Scenarios**: 4 distinct scenarios - all events, event filtering, token filtering, combined filtering
- **DEX Stream Scenarios**: 3 scenarios - direct pool monitoring, token pool discovery, single token discovery
- **Historical Indexing**: Improved `curve_indexer.ts` and `dex_indexer.ts` with batch processing demonstrations
- **Real-time Filtering**: Support for `--events` and `--tokens` CLI arguments for precise event monitoring

**Improved Token Examples**

- **Basic Operations**: New `basic_operations.ts` covering metadata, balances, allowances, transfers
- **Permit Signatures**: Dedicated `permit_signature.ts` for EIP-2612 gasless approvals
- **Health Checks**: Token contract validation and permit support detection
- **Safety Features**: Transaction execution commented out by default for safety

### 🔧 API Changes

**Transport Layer Updates**

```typescript
// NEW (v0.2.5) - Explicit transport specification
// WebSocket transport for real-time streaming
const curveStream = new CurveStream(wsUrl) // Uses webSocket(wsUrl) internally
const dexStream = new DexStream(wsUrl, pools) // Uses webSocket(wsUrl) internally

// HTTP transport for historical indexing
const curveIndexer = new CurveIndexer(rpcUrl) // Uses http(rpcUrl) internally
const dexIndexer = new DexIndexer(rpcUrl, pools) // Uses http(rpcUrl) internally

// Internal viem client configuration
createPublicClient({
  chain: monadTestnet,
  //If Stream
  transport: webSocket(wsUrl),
  //If Indexer
  transport: http(rpcUrl),
})
```

**New Example Files**

```typescript
// New token examples
examples / token / basic_operations.ts // Replaces token_utils.ts
examples / token / permit_signature.ts // New dedicated permit example

// New streaming example
examples / stream / pool_discovery.ts // Automated pool discovery utility
```

**Updated Stream APIs**

```typescript
// Enhanced filtering capabilities
curveStream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell])
curveStream.filterTokens(['0xToken1', '0xToken2'])

// Simplified pool discovery
const stream = await DexStream.discoverPoolsForTokens(wsUrl, tokens)
```

### ⚠️ Migration Guide

**For Users Upgrading from v0.2.4:**

1. **Update Token Example Imports**:

```typescript
// OLD (v0.2.4)
import { executeTokenUtilsExample } from './examples/token/token_utils'

// NEW (v0.2.5)
import { executeTokenUtilsExample } from './examples/token/basic_operations'
```

2. **Use New Streaming Patterns**:

```typescript
// OLD (v0.2.4) - Single pattern
const stream = new CurveStream(wsUrl)

// NEW (v0.2.5) - Scenario-based
// Scenario 1: All events
// Scenario 2: Filtered events (--events Buy,Sell)
// Scenario 3: Filtered tokens (--tokens 0xToken1,0xToken2)
// Scenario 4: Combined (--events Buy,Sell --tokens 0xToken1)
```

3. **Leverage Pool Discovery**:

```typescript
// NEW (v0.2.5)
bun run example:pool-discovery -- --tokens 0xToken1,0xToken2
```

### 🔍 Examples

**New Examples Structure**:

```bash
# Token operations
bun run example:basic-operations   # Basic ERC-20 operations
bun run example:permit-signature   # EIP-2612 permit signatures

# Streaming with scenarios
bun run example:curve-stream -- --events Buy,Sell --tokens 0xToken1
bun run example:dex-stream -- --pools 0xPool1,0xPool2

# Pool discovery
bun run example:pool-discovery -- --tokens 0xToken1,0xToken2
```

**Enhanced CLI Arguments**:

- `--events <TYPES>`: Filter by event types (Create,Buy,Sell,Sync,Lock,Listed)
- `--tokens <ADDRS>`: Filter by token addresses
- `--pools <ADDRS>`: Specify pool addresses directly
- `--recipient <ADDR>`: Required for token transfer examples

### 🏆 Benefits

- **Better Organization**: Clear separation between basic operations and advanced features
- **Improved Discoverability**: Scenario-based examples make it easier to find relevant code
- **Production Ready**: Examples include safety features and error handling
- **Consistent Structure**: All examples follow the same pattern as Rust SDK

### 📦 Installation

```json
{
  "dependencies": {
    "@nadfun/sdk": "^0.2.5"
  }
}
```

---

# Previous Changelog

## [0.2.4]

- Update

## [0.2.4]

## Bug Fix

- Delete socket logic cuz sdk not support with webSocket
- Delete wrong subscribe example

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
