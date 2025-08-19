# 🔧 Nad.fun TypeScript SDK v0.1.1

**Release Date**: 2025-08-19  
**Patch Release**: Documentation and example improvements

## 🔄 Changes

### 📚 **Updated Documentation**
- **Examples**: Changed all npm commands to bun for better performance
- **README**: Updated installation and usage examples to prioritize bun
- **Consistency**: All documentation now reflects bun as the primary package manager

## 📦 Installation

```bash
bun add @nadfun/sdk
# or
npm install @nadfun/sdk
```

## 🔄 Updated Commands

All examples now use `bun run` instead of `npm run`:

```bash
# Trading Examples
bun run example:buy
bun run example:sell  
bun run example:sell-permit

# Stream Examples
bun run example:curve-stream
bun run example:dex-stream

# Utility Examples
bun run example:basic-ops
bun run example:gas-estimator
```

## 🔗 Links

- **npm Package**: https://www.npmjs.com/package/@nadfun/sdk
- **Repository**: https://github.com/Naddotfun/nadfun-sdk-typescript
- **Previous Release**: [v0.1.0](https://github.com/Naddotfun/nadfun-sdk-typescript/releases/tag/v0.1.0)

## 💡 Note

All core functionality remains the same as v0.1.0. This is purely a documentation update to improve developer experience with bun.

---

**Full Changelog**: v0.1.0...v0.1.1