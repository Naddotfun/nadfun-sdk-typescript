/**
 * DEX real-time streaming example
 *
 * Demonstrates 3 different DEX streaming scenarios:
 * 1. Monitor specific pool addresses directly
 * 2. Auto-discover pools for specific tokens
 * 3. Monitor single token's pool
 *
 * Usage:
 * # Scenario 1: Monitor specific pool addresses
 * bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --pools 0xPool1,0xPool2
 *
 * # Scenario 2: Auto-discover pools for tokens
 * bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --tokens 0xToken1,0xToken2
 *
 * # Scenario 3: Monitor single token's pool
 * bun run example:dex-stream -- --ws-url wss://your-ws-endpoint --token 0xTokenAddress
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { Stream as DexStream } from '../../src/stream/dex/stream'
import { SwapEvent } from '../../src/types'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'ws-url': { type: 'string' },
    pools: { type: 'string' },
    token: { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const WS_URL = args['ws-url'] || process.env.WS_RPC_URL
const POOLS =
  args.pools
    ?.split(',')
    .map(p => p.trim())
    .filter(p => p) ||
  (process.env.POOLS
    ? process.env.POOLS.split(',')
        .map(p => p.trim())
        .filter(p => p)
    : []) ||
  []
const TOKENS =
  args.tokens
    ?.split(',')
    .map(t => t.trim())
    .filter(t => t) ||
  (process.env.TOKENS
    ? process.env.TOKENS.split(',')
        .map(t => t.trim())
        .filter(t => t)
    : []) ||
  []
const SINGLE_TOKEN = args.token || process.env.TOKEN

let swapCount = 0

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   WS URL: ${WS_URL}`)
  if (POOLS.length > 0) {
    console.log(`   Pools: ${POOLS.join(', ')}`)
  }
  if (TOKENS.length > 0) {
    console.log(`   Tokens: ${TOKENS.join(', ')}`)
  }
  if (SINGLE_TOKEN) {
    console.log(`   Single Token: ${SINGLE_TOKEN}`)
  }
  console.log('')

  if (!WS_URL) {
    console.error('❌ WebSocket URL is required')
    console.log('💡 Usage: --ws-url wss://your-ws-url')
    process.exit(1)
  }

  try {
    // Determine scenario based on arguments
    if (POOLS.length > 0) {
      console.log(`🎯 SCENARIO 1: Monitoring specific pool addresses: ${POOLS.length} pools`)
      await runSpecificPoolsScenario(WS_URL, POOLS as `0x${string}`[])
    } else if (TOKENS.length > 0) {
      console.log(`🔍 SCENARIO 2: Auto-discovering pools for ${TOKENS.length} tokens`)
      await runTokenDiscoveryScenario(WS_URL, TOKENS as `0x${string}`[])
    } else if (SINGLE_TOKEN) {
      console.log('🏷️ SCENARIO 3: Single token pool discovery')
      await runSingleTokenScenario(WS_URL, SINGLE_TOKEN as `0x${string}`)
    } else {
      console.log('❌ Please provide either:')
      console.log('   - Pool addresses: --pools 0xPool1,0xPool2')
      console.log('   - Token addresses: --tokens 0xToken1,0xToken2')
      console.log('   - Single token: --token 0xTokenAddress')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Scenario 1: Monitor specific pool addresses directly
async function runSpecificPoolsScenario(wsUrl: string, poolAddresses: `0x${string}`[]) {
  console.log('📡 Creating DexStream for specific pools...')

  poolAddresses.forEach((pool, i) => {
    console.log(`   ${i + 1}. Pool: ${pool}`)
  })

  const swapStream = new DexStream(wsUrl, poolAddresses)

  swapStream.onSwap(event => {
    handleSwapEvent(event, 'SPECIFIC_POOLS')
  })

  console.log('🔴 Listening for DEX swap events in specified pools...')
  await swapStream.start()

  setupGracefulShutdown(swapStream)
  await keepRunning()
}

// Scenario 2: Auto-discover pools for specific tokens
async function runTokenDiscoveryScenario(wsUrl: string, tokenAddresses: `0x${string}`[]) {
  console.log('📡 Auto-discovering pools for tokens...')

  tokenAddresses.forEach((token, i) => {
    console.log(`   ${i + 1}. Token: ${token}`)
  })

  const swapStream = await DexStream.discoverPoolsForTokens(wsUrl, tokenAddresses)

  const discoveredPools = swapStream.getPoolAddresses()
  console.log(`✅ Discovered ${discoveredPools.length} pools`)

  if (discoveredPools.length === 0) {
    console.log('⚠️  No pools found for the specified tokens')
    return
  }

  swapStream.onSwap(event => {
    handleSwapEvent(event, 'TOKEN_DISCOVERY')
  })

  console.log('🔍 Listening for DEX swap events in discovered pools...')
  await swapStream.start()

  setupGracefulShutdown(swapStream)
  await keepRunning()
}

// Scenario 3: Single token pool discovery
async function runSingleTokenScenario(wsUrl: string, tokenAddress: `0x${string}`) {
  console.log('📡 Discovering pool for single token...')
  console.log(`   Token: ${tokenAddress}`)

  const swapStream = await DexStream.discoverPoolsForTokens(wsUrl, [tokenAddress])

  const discoveredPools = swapStream.getPoolAddresses()
  console.log(`✅ Discovered ${discoveredPools.length} pool(s)`)

  if (discoveredPools.length === 0) {
    console.log('⚠️  No pool found for the specified token')
    return
  }

  swapStream.onSwap(event => {
    handleSwapEvent(event, 'SINGLE_TOKEN')
  })

  console.log('🏷️ Listening for DEX swap events in discovered pool...')
  await swapStream.start()

  setupGracefulShutdown(swapStream)
  await keepRunning()
}

function handleSwapEvent(event: SwapEvent, scenario: string) {
  swapCount++
  console.log(
    `💱 [${scenario}] Swap in pool ${event.pool} | Block: ${event.blockNumber} | TxIndex: ${event.transactionIndex}`
  )

  console.log(`   💰 Amount0: ${event.amount0} | Amount1: ${event.amount1}`)

  console.log(`   👤 Sender: ${event.sender} | Recipient: ${event.recipient}`)

  console.log(
    `   📊 Liquidity: ${event.liquidity} | Tick: ${event.tick} | Price: ${event.sqrtPriceX96}`
  )

  console.log('   ─────────────────────────────────────')
}

function setupGracefulShutdown(stream: DexStream) {
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
}

async function keepRunning() {
  console.log('✅ Stream active! Monitoring swap events...')
  console.log('💡 Execute swaps on monitored pools to see live events')
  console.log('⏳ Press Ctrl+C to stop')
  console.log('')

  // Keep running indefinitely
  await new Promise(() => {})
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main as runDexStreamExample }
