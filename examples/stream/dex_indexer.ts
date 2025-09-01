/**
 * DEX historical indexing example
 *
 * Shows how to:
 * 1. Create DEX indexer with HTTP provider
 * 2. Discover pools for tokens or use specific pools
 * 3. Fetch swap events from specific block ranges
 * 4. Analyze swap statistics and volume
 * 5. Handle large data sets with batching
 *
 * Usage:
 * # Use environment variables
 * export RPC_URL="https://your-rpc-url"
 * bun run example:dex-indexer
 *
 * # Or use CLI arguments
 * bun run example:dex-indexer -- --rpc-url https://your-rpc-url --tokens 0xToken1,0xToken2
 * bun run example:dex-indexer -- --pools 0xPool1,0xPool2
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { monadTestnet } from 'viem/chains'
import { DexIndexer } from '../../src/stream'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    pools: { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const POOL_ADDRESSES = (args.pools?.split(',').map(p => p.trim()) || []) as `0x${string}`[]
const TOKEN_ADDRESSES =
  args.tokens?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) ||
  process.env.TOKEN?.split(',').map(t => t.trim()) ||
  []

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   RPC URL: ${RPC_URL}`)
  if (POOL_ADDRESSES.length > 0) {
    console.log(`   Pools: ${POOL_ADDRESSES.join(', ')}`)
  }
  if (TOKEN_ADDRESSES.length > 0) {
    console.log(`   Tokens: ${TOKEN_ADDRESSES.join(', ')}`)
  }
  console.log('')

  console.log('📈 Historical Event Fetching\n')

  try {
    // 1. Create indexer based on configuration
    let indexer: DexIndexer

    if (POOL_ADDRESSES.length > 0) {
      // Use provided pool addresses directly
      indexer = new DexIndexer(RPC_URL, POOL_ADDRESSES)
      console.log(`✅ Using ${POOL_ADDRESSES.length} pool addresses`)
    } else if (TOKEN_ADDRESSES.length > 0) {
      // Discover pools for token addresses
      console.log('🔍 Discovering pools for tokens...')
      indexer = await DexIndexer.discoverPoolsForTokens(RPC_URL, TOKEN_ADDRESSES as `0x${string}`[])

      const discoveredPools = indexer.getPoolAddresses()
      console.log(`✅ Discovered ${discoveredPools.length} pools`)

      if (discoveredPools.length === 0) {
        console.log('⚠️  No pools found for the specified tokens')
        return
      }
    } else {
      console.log('❌ No pool addresses or token addresses provided')
      console.log('💡 Usage: --tokens 0xToken1,0xToken2 or --pools 0xPool1,0xPool2')
      return
    }

    // 2. Fetch events from specific block range
    const currentBlock = Number(await indexer.publicClient.getBlockNumber())

    const events = await indexer.fetchEvents(
      currentBlock - 100, // from_block
      currentBlock // to_block
    )

    console.log(`✅ Found ${events.length} swap events`)

    // 3. Show first 10 events
    if (events.length > 0) {
      console.log('\n📊 Events (showing first 10):')
      for (const event of events.slice(0, 10)) {
        console.log(`   Swap | Pool: ${event.pool} | Block: ${event.blockNumber}`)
      }
    }

    // 4. Test fetch_all_events with automatic batching
    console.log('\n🔄 Testing fetch_all_events with automatic batching...')
    const batchSize = 100 // 100 blocks per batch
    const startBlock = currentBlock - 1000

    const allEvents = await indexer.fetchAllEvents(startBlock, batchSize)

    console.log('📦 Batch processing results:')
    console.log(`   Start block: ${startBlock}`)
    console.log(`   End block: ${currentBlock}`)
    console.log(`   Batch size: ${batchSize} blocks`)
    console.log(`   Total events found: ${allEvents.length}`)

    if (allEvents.length > 0) {
      console.log('\n📊 Events from batch processing (showing first 10):')
      for (const event of allEvents.slice(0, 10)) {
        console.log(`🔄 Swap | Pool: ${event.pool} | Block: ${event.blockNumber}`)
      }

      // Show unique pools found
      const uniquePools = new Set<string>()
      for (const event of allEvents) {
        uniquePools.add(event.pool)
      }

      console.log('\n📊 Unique pools found in batch processing:')
      for (const pool of Array.from(uniquePools)) {
        console.log(`  ${pool}`)
      }

      // Show unique traders
      const uniqueTraders = new Set<string>()
      for (const event of allEvents) {
        uniqueTraders.add(event.sender)
        uniqueTraders.add(event.recipient)
      }

      console.log('\n📈 Statistics:')
      console.log(`  Total swaps: ${allEvents.length}`)
      console.log(`  Unique pools: ${uniquePools.size}`)
      console.log(`  Unique addresses: ${uniqueTraders.size}`)
    }

    console.log('\n📦 Historical data example completed successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main as executeDexIndexing }
