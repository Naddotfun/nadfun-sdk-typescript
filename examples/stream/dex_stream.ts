/**
 * DEX Event Stream Example
 *
 * Demonstrates how to use the SDK's built-in DEX Stream class
 * for monitoring Uniswap V3 swap events with automatic pool discovery.
 *
 * Usage:
 * bun run example:dex-stream -- --token 0xTokenAddress
 * bun run example:dex-stream -- --tokens 0xToken1,0xToken2
 * bun run example:dex-stream -- --pools 0xPool1,0xPool2
 */

import { config } from 'dotenv'
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'
import { Stream as DexStream } from '../../src/stream/dex/stream'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    'ws-url': { type: 'string' },
    pools: { type: 'string' },
    token: { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const WS_URL = args['ws-url'] || process.env.WS_URL
const POOL_ADDRESSES = args.pools?.split(',').map(p => p.trim()) || []
const TOKEN_ADDRESS = args.token
const TOKEN_ADDRESSES = args.tokens?.split(',').map(t => t.trim()) || []

let swapCount = 0

async function runDexStreamExample() {
  console.log('🏊 NADS Pump SDK - DEX Stream Example\n')

  // Determine tokens to use for pool discovery
  const tokensForDiscovery = []
  if (TOKEN_ADDRESS) {
    tokensForDiscovery.push(TOKEN_ADDRESS)
  }
  if (TOKEN_ADDRESSES.length > 0) {
    tokensForDiscovery.push(...TOKEN_ADDRESSES)
  }

  // Check if we have either pools or tokens
  if (POOL_ADDRESSES.length === 0 && tokensForDiscovery.length === 0) {
    console.log('❌ No pool addresses or token addresses provided')
    console.log('💡 Usage options:')
    console.log('   bun run example:dex-stream -- --token 0xTokenAddress')
    console.log('   bun run example:dex-stream -- --tokens 0xToken1,0xToken2')
    console.log('   bun run example:dex-stream -- --pools 0xPool1,0xPool2')
    console.log('')
    showUsageExamples()
    return
  }

  try {
    // Initialize client using SDK standards
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http(RPC_URL),
    })

    let stream: DexStream

    if (POOL_ADDRESSES.length > 0) {
      // Use provided pool addresses directly
      console.log('📍 Using provided pool addresses...')
      stream = new DexStream(client, POOL_ADDRESSES)

      console.log('📋 Configuration:')
      console.log(`   Mode: Direct pool monitoring`)
      console.log(`   Pool Count: ${POOL_ADDRESSES.length}`)
      console.log(`   Pools: ${POOL_ADDRESSES.join(', ')}`)
    } else {
      // Use pool discovery for token addresses
      console.log('🔍 Discovering pools for token addresses...')
      console.log(`   Tokens: ${tokensForDiscovery.join(', ')}`)
      console.log('   Using NADS standard fee tier (1%)')
      console.log('')

      stream = await DexStream.discoverPoolsForTokens(client, tokensForDiscovery)

      const discoveredPools = stream.getPoolAddresses()
      console.log('📋 Configuration:')
      console.log(`   Mode: Automatic pool discovery`)
      console.log(`   Token Count: ${tokensForDiscovery.length}`)
      console.log(`   Discovered Pools: ${discoveredPools.length}`)

      if (discoveredPools.length > 0) {
        console.log('   Pool Addresses:')
        discoveredPools.forEach((pool, i) => {
          console.log(`     ${i + 1}. ${pool}`)
        })
      } else {
        console.log('   ⚠️  No pools found - may not exist with NADS fee tier')
        return
      }
    }

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

// Usage examples helper
function showUsageExamples() {
  console.log('🔍 Usage Examples:')
  console.log('')
  console.log('1. 🎯 Single Token (Auto Pool Discovery):')
  console.log('   bun run example:dex-stream -- --token 0xe622377AaB9C22eA5Fd2622899fF3c060eA27F53')
  console.log('')
  console.log('2. 🎯 Multiple Tokens (Auto Pool Discovery):')
  console.log('   bun run example:dex-stream -- --tokens 0xToken1,0xToken2,0xToken3')
  console.log('')
  console.log('3. 📍 Direct Pool Addresses:')
  console.log('   bun run example:dex-stream -- --pools 0xPool1,0xPool2')
  console.log('')
  console.log('4. 🌐 Custom RPC:')
  console.log('   bun run example:dex-stream -- --token 0xToken --rpc-url https://custom-rpc.com')
  console.log('')
  console.log('💡 Pool Discovery Info:')
  console.log('   - Automatically finds WMON pairs with NADS 1% fee tier')
  console.log('   - Uses V3 Factory: 0x961235a9020B05C44DF1026D956D1F4D78014276')
  console.log('   - WMON Address: 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701')
}

// Run the example
if (require.main === module) {
  runDexStreamExample().catch(error => {
    console.error('\n💥 Example failed:', error)
    process.exit(1)
  })
}

export { runDexStreamExample }
