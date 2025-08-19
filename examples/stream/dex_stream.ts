/**
 * DEX Event Stream Example
 *
 * Demonstrates how to use the SDK's built-in DEX Stream class
 * for monitoring Uniswap V3 swap events.
 *
 * Usage:
 * npm run example:dex-stream -- --pools 0xPool1,0xPool2
 */

import { config } from 'dotenv'
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'
import { Stream as DexStream } from '../../src/stream/dex/Stream'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    pools: { type: 'string' },
  },
  allowPositionals: false,
})

const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const POOL_ADDRESSES = args.pools?.split(',').map(p => p.trim()) || []

let swapCount = 0

async function runDexStreamExample() {
  console.log('🏊 NADS Pump SDK - DEX Stream Example\n')

  if (POOL_ADDRESSES.length === 0) {
    console.log('❌ No pool addresses provided')
    console.log('💡 Usage: bun run example:dex-stream -- --pools 0xPool1,0xPool2')
    console.log('')
    showPoolDiscoveryTips()
    return
  }

  try {
    // Initialize client using SDK standards
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http(RPC_URL),
    })

    // Create DEX stream using SDK
    const stream = new DexStream(client, POOL_ADDRESSES)

    console.log('📋 Configuration:')
    console.log(`   Using SDK DexStream class`)
    console.log(`   Pool Count: ${POOL_ADDRESSES.length}`)
    console.log(`   Pools: ${POOL_ADDRESSES.join(', ')}`)
    console.log('')

    // Set up swap event handler
    stream.onSwap(event => {
      swapCount++
      console.log(`\n🔄 Swap Event #${swapCount}`)
      console.log(`   Block: ${event.blockNumber}`)
      console.log(`   Pool: ${event.pool}`)
      console.log(`   Sender: ${event.sender}`)
      console.log(`   Recipient: ${event.recipient}`)
      console.log(`   Amount0: ${event.amount0}`)
      console.log(`   Amount1: ${event.amount1}`)
      console.log(`   Liquidity: ${event.liquidity}`)
      console.log(`   Tick: ${event.tick}`)
      console.log(`   TX: ${event.transactionHash}`)
    })

    console.log('🚀 Starting DEX stream...')
    await stream.start()

    console.log('✅ Stream active! Monitoring swap events...')
    console.log('💡 Execute swaps on monitored pools to see live events')
    console.log('⏳ Press Ctrl+C to stop')
    console.log('')

    // Show stats every 30 seconds
    const statsInterval = setInterval(() => {
      if (swapCount > 0) {
        console.log(`📊 Swaps captured: ${swapCount}`)
      } else {
        console.log('⏳ Waiting for swaps...')
      }
    }, 30000)

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping stream...')
      clearInterval(statsInterval)
      stream.stop()
      console.log(`📊 Final stats: ${swapCount} swaps captured`)
      process.exit(0)
    })

    // Keep running
    await new Promise(() => {})
  } catch (error) {
    console.error('❌ DEX stream example failed:', error)
    throw error
  }
}

// Pool discovery helper
function showPoolDiscoveryTips() {
  console.log('🔍 Pool Discovery Tips:')
  console.log('')
  console.log('1. 🏭 Use Uniswap V3 Factory:')
  console.log('   const factory = getContract({ address: FACTORY_ADDRESS, abi: factoryAbi })')
  console.log('   const pool = await factory.read.getPool([token0, token1, fee])')
  console.log('')
  console.log('2. 📊 Common fee tiers:')
  console.log('   - 500: 0.05% (stablecoin pairs)')
  console.log('   - 3000: 0.3% (standard pairs)')
  console.log('   - 10000: 1% (exotic pairs) - NADS standard')
  console.log('')
  console.log('3. 🔍 Find pools on DEX explorers:')
  console.log('   - Check popular DEX analytics sites')
  console.log('   - Look for WMON pairs')
  console.log('   - Use pool discovery tools')
}

// Run the example
if (require.main === module) {
  runDexStreamExample().catch(error => {
    console.error('\n💥 Example failed:', error)
    process.exit(1)
  })
}

export { runDexStreamExample }
