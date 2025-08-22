# 📡 Stream API Examples

This directory contains examples demonstrating the enhanced Stream API that provides **real-time event streaming** using viem's `watchContractEvent` and `watchEvent` methods.

## 🚀 Key Features

### ✅ Implemented Features

- **Real-time Event Listening**: Uses viem's watchEvent API
- **HTTP Support**: Automatic transport detection with fallback
- **Auto Reconnection**: Exponential backoff retry on connection failures
- **Enhanced Error Handling**: Granular error handling at each stage
- **Type Safety**: Full TypeScript support
- **Event Filtering**: Filter by token addresses and event types

### 🎯 Core Benefits

1. **True Real-time**: No more polling - actual real-time events
2. **Auto Reconnection**: Automatic reconnection attempts on network issues
3. **Memory Efficient**: Optimized event listener management

## 📖 Usage Examples

### 1. Bonding Curve Stream

```typescript
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'
import { Stream as CurveStream } from '@/stream/curve/stream'
import { CurveEventType } from '@/stream/curve/types'

// Create client
const client = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz'),
})

// Create and configure stream
const curveStream = new CurveStream(client)

// Subscribe to specific events
curveStream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell])

// Filter specific tokens
curveStream.filterTokens([
  '0x1234...', // token address
  '0x5678...', // token address
])

// Add event listener
const subscribe = curveStream.onEvent(event => {
  console.log('New event:', event)
})

// Start streaming
await curveStream.start()

// Stop later
curveStream.stop()
```

### 2. DEX Swap Stream

```typescript
import { Stream as DexStream } from '@/stream/dex/stream'

// Or create with HTTP
const dexStreamHttp = await DexStream(
  'https://testnet-rpc.monad.xyz', // HTTP URL
  ['0xpool1...', '0xpool2...'] // Pool addresses to monitor
)

// Listen for swap events
const subscribe = dexStream.onSwap(swapEvent => {
  console.log('Swap occurred:', {
    pool: swapEvent.pool,
    amount0: swapEvent.amount0,
    amount1: swapEvent.amount1,
    price: swapEvent.sqrtPriceX96,
    sender: swapEvent.sender,
    recipient: swapEvent.recipient,
  })
})

// Start streaming
await dexStream.start()

// Add new pools later
dexStream.addPoolAddresses(['0xnewPool...'])
```

### 3. Status Monitoring

```typescript
// Check stream status
console.log('Curve stream running:', curveStream.isStreaming())
console.log('DEX stream running:', dexStream.isStreaming())

// Check reconnection status
const curveReconnectStatus = curveStream.getReconnectionStatus()
console.log(
  `Curve reconnection: ${curveReconnectStatus.attempts}/${curveReconnectStatus.maxAttempts}`
)

const dexReconnectStatus = dexStream.getReconnectionStatus()
console.log(`DEX reconnection: ${dexReconnectStatus.attempts}/${dexReconnectStatus.maxAttempts}`)

// Get configuration info
const curveConfig = curveStream.getConfiguration()
console.log('Curve config:', curveConfig)

const dexConfig = dexStream.getConfiguration()
console.log('DEX config:', dexConfig)
```

## 🔧 Advanced Features

### Transport Options

```typescript
// HTTP only (more reliable)
const stream = await DexStream.createHttp('https://testnet-rpc.monad.xyz', pools)

// Or create with existing client
const client = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz'),
})

const stream = new DexStream(client, pools)
```

### Reconnection Logic

Reconnection is handled automatically with:

- **Max attempts**: 5 retries
- **Exponential backoff**: 1s → 2s → 4s → 8s → 16s
- **Reset on success**: Retry count resets when events are successfully received

### Event Filtering

```typescript
// Bonding Curve: Filter by event types
curveStream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell])

// Bonding Curve: Filter by tokens
curveStream.filterTokens(['0xtoken1...', '0xtoken2...'])

// Both filters can be applied (AND condition)
```

## 📝 Example Files

- `curve_stream.ts` - Bonding Curve stream example
- `dex_stream.ts` - DEX swap stream example
- `curve_indexer.ts` - Historical event indexing example

## ⚠️ Important Notes

### Transport Selection

- **HTTP**: Use for stability-critical applications (more reliable)

### Pool Addresses

DEX Stream requires actual deployed Uniswap V3 pool addresses.

### Error Handling

All event listeners are wrapped in try-catch blocks to prevent stream interruption.

## 🔍 Debugging

### Log Output

The stream provides detailed logging:

```
🎯 Starting bonding curve stream
📍 Router address: 0x...
📋 Event types: Buy, Sell, Create
📡 Using http transport
✅ Bonding curve stream started successfully
```

### Status Monitoring

```typescript
setInterval(() => {
  console.log('Stream status:', stream.isStreaming())
  console.log('Reconnection status:', stream.getReconnectionStatus())
}, 10000)
```

### Performance Optimization

- **Polling Interval**: Adjust `pollingInterval` for HTTP transport
- **Listener Cleanup**: Always remove unused listeners
- **Filter Usage**: Use filtering to improve performance

## 🔮 Future Roadmap

- [ ] Enhanced event filtering options
- [ ] Event batch processing optimization
- [ ] Custom reconnection strategies
- [ ] Metrics and monitoring features
