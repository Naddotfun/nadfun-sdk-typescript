/**
 * Bonding Curve Event Stream Example
 *
 * Demonstrates how to use the SDK's built-in curve Stream class
 * for real-time bonding curve event monitoring.
 *
 * Usage:
 * bun run example:curve-stream
 */

import { config } from 'dotenv'
import { monadTestnet } from 'viem/chains'
import { Stream as CurveStream } from '../../src/stream/curve/Stream'
import { CurveEventType } from '../../src/types'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    token: { type: 'string' },
  },
  allowPositionals: false,
})

const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const TOKEN_ADDRESS =
  args.token || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'

let eventCount = 0

async function runCurveStreamExample() {
  console.log('📊 NADS Fun SDK - Curve Stream Example\n')

  try {
    // Create curve stream using SDK
    const stream = new CurveStream(RPC_URL)

    console.log('📋 Configuration:')
    console.log(`   Using SDK CurveStream class`)
    console.log(`   Monitoring: Buy, Sell, Create events`)
    if (TOKEN_ADDRESS) {
      console.log(`   Token Filter: ${TOKEN_ADDRESS}`)
    } else {
      console.log(`   Token Filter: All tokens`)
    }
    console.log('')

    // Subscribe to specific events
    stream.subscribeEvents([CurveEventType.Buy, CurveEventType.Sell, CurveEventType.Create])

    // Filter by specific token if provided
    if (TOKEN_ADDRESS) {
      stream.filterTokens([TOKEN_ADDRESS])
    }

    // Set up event handler
    const unsubscribe = stream.onEvent(event => {
      eventCount++
      console.log(`\n🎪 ${event.type} Event #${eventCount}`)
      console.log(`   Block: ${event.blockNumber}`)
      console.log(`   Token: ${event.token}`)
      console.log(`   TX: ${event.transactionHash}`)

      // Type-specific details
      if (event.type === 'Buy' && 'sender' in event) {
        console.log(`   Sender: ${event.sender}`)
        console.log(`   Amount In: ${event.amountIn}`)
        console.log(`   Amount Out: ${event.amountOut}`)
      } else if (event.type === 'Sell' && 'sender' in event) {
        console.log(`   Sender: ${event.sender}`)
        console.log(`   Amount In: ${event.amountIn}`)
        console.log(`   Amount Out: ${event.amountOut}`)
      } else if (event.type === 'Create' && 'creator' in event) {
        console.log(`   Creator: ${event.creator}`)
        console.log(`   Pool: ${event.pool}`)
        console.log(`   Name: ${event.name}`)
        console.log(`   Symbol: ${event.symbol}`)
      }
    })

    console.log('🚀 Starting curve stream...')
    await stream.start()

    console.log('✅ Stream active! Monitoring bonding curve events...')
    console.log('💡 Execute buy/sell transactions to see live events')
    console.log('⏳ Press Ctrl+C to stop')
    console.log('')

    // Show stats every 30 seconds
    const statsInterval = setInterval(() => {
      if (eventCount > 0) {
        console.log(`📊 Events captured: ${eventCount}`)
      } else {
        console.log('⏳ Waiting for events...')
      }
    }, 30000)

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping stream...')
      clearInterval(statsInterval)
      unsubscribe()
      stream.stop()
      console.log(`📊 Final stats: ${eventCount} events captured`)
      process.exit(0)
    })

    // Keep running
    await new Promise(() => {})
  } catch (error) {
    console.error('❌ Curve stream example failed:', error)
    throw error
  }
}

// Run the example
if (require.main === module) {
  runCurveStreamExample().catch(error => {
    console.error('\n💥 Example failed:', error)
    process.exit(1)
  })
}

export { runCurveStreamExample }
