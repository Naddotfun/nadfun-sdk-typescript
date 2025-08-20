# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2024-12-19

### 📚 Documentation Improvements

### 🐛 Bug Fixes

- **Documentation Corrections**:
  - Fixed `customGas` examples in high-speed mode documentation
  - Corrected default behavior description for `customGas` option
  - Updated type annotations for better clarity

## [0.2.0] - 2024-12-19

### 🚀 Major Features

#### Intelligent Gas Management System

- **Smart Gas Estimation**: Real-time gas estimation is now the default behavior for all trading operations
- **Unified Gas Control**: Introduced `customGas` option to seamlessly switch between real-time estimation and pre-configured limits
- **Safety Buffers**: Added `gasBufferPercent` option for adding safety margins to gas estimates
- **Zero Configuration**: Trading operations work optimally without any gas configuration

#### Enhanced Trading Functions

- **Streamlined API**: Removed confusing `gasLimit` parameter in favor of intelligent `customGas` system
- **Improved Transaction Reliability**: Better success rates with network-aware gas estimation
- **Optimized for Different Use Cases**:
  - Default mode for general applications (real-time estimation)
  - High-speed mode for bots (`customGas: true`)
  - Safety mode with buffers for critical operations

### ✨ New Features

- **Real-time Gas Estimation**: Automatic gas calculation based on current network conditions
- **Flexible Buffer System**: Percentage-based safety margins (e.g., 20% buffer)
- **Router Type Auto-detection**: Smart detection of bonding curve vs DEX routers
- **Enhanced Error Handling**: Better error messages for gas estimation failures
- **Transaction Receipt Waiting**: Improved approval flow with proper transaction confirmation

### 🔧 Improvements

- **Code Organization**: Better structure with clear separation of trade and token functions
- **Performance Optimization**: Reduced RPC calls when using GasConfig mode
- **Type Safety**: Enhanced TypeScript types for gas estimation parameters
- **Developer Experience**: More intuitive API with sensible defaults

### 🗑️ Breaking Changes

- **Removed `gasLimit` Parameter**: Use `customGas` and `gasBufferPercent` instead

  ```typescript
  // Before (v0.1.x)
  await trade.buy(params, router, { gasLimit: 200000n })

  // After (v0.2.0) - Automatic optimization
  await trade.buy(params, router)

  // After (v0.2.0) - With safety buffer
  await trade.buy(params, router, { gasBufferPercent: 20 })
  ```

- **Simplified Options Interface**: Removed redundant parameters for cleaner API
- **Changed Default Behavior**: Real-time gas estimation is now enabled by default

### 🐛 Bug Fixes

- Fixed gas estimation for permit transactions
- Improved transaction confirmation logic in sellWithApprove
- Better handling of undefined gas configuration values
- Fixed TypeScript compilation errors related to gas parameters

### 📚 Documentation

- Added comprehensive gas management examples
- Updated API documentation with new gas options
- Provided migration guide for upgrading from v0.1.x

### 🏗️ Internal Changes

- Enhanced gas utility functions with better error handling
- Improved code structure and organization
- Better separation of concerns between trade and token operations
- Optimized import statements and reduced bundle size

## Migration Guide (v0.1.x → v0.2.0)

### Gas Management Changes

**Old Way (v0.1.x)**:

```typescript
// Manual gas calculation required
await trade.buy(params, router, {
  gasLimit: 200000n,
  routerType: 'bonding',
})
```

**New Way (v0.2.0)**:

```typescript
// Automatic - works perfectly without configuration
await trade.buy(params, router)

// With safety buffer for production
await trade.buy(params, router, {
  gasBufferPercent: 15,
})

// High-speed mode for bots
await trade.buy(params, router, {
  customGas: true, //you can custom your gasConfig by updateGasConfig function
})
```

### Benefits of Upgrading

1. **Better Success Rates**: Network-aware gas estimation reduces failed transactions
2. **Simpler Code**: No more manual gas calculations
3. **Improved Performance**: Intelligent defaults with option for speed optimization
4. **Enhanced Safety**: Built-in buffer system for critical operations
5. **Future-Proof**: Adaptable to changing network conditions

## [0.1.1-rc.3] - Previous Release

- Initial release candidate with basic trading functionality
- Support for buy, sell, and sellPermit operations
- Integration with bonding curves and DEX routers
- Token management utilities
- Stream processing capabilities

---

For full details on usage and examples, see the [README.md](README.md) and [examples/](examples/) directory.
