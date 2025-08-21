/**
 * Bonding curve historical indexing example
 *
 * Shows how to:
 * 1. Create curve indexer with HTTP provider
 * 2. Fetch bonding curve events from specific block ranges
 * 3. Filter by event types (Create, Buy, Sell) and tokens
 * 4. Handle large data sets with batching
 *
 * Usage:
 * # Use environment variables
 * export RPC_URL="https://your-rpc-url"
 * bun run example:curve-indexer
 *
 * # Or use CLI arguments
 * bun run example:curve-indexer -- --rpc-url https://your-rpc-url --tokens 0xToken1,0xToken2
 */

import { config } from 'dotenv'
import { monadTestnet } from 'viem/chains'
import { Indexer as CurveIndexer } from '../../src/stream/curve/indexer'
import { CurveEventType } from '../../src/types'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const TOKENS =
  args['tokens']?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) ||
  []

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   RPC URL: ${RPC_URL}`)
  if (TOKENS.length > 0) {
    console.log(`   Tokens: ${TOKENS.join(', ')}`)
  }
  console.log('')

  console.log('📈 Historical Event Fetching\n')

  try {
    // 1. Create HTTP provider and indexer
    const indexer = new CurveIndexer(RPC_URL)

    // 2. Fetch events from specific block range (wider range to find events)
    const currentBlock = Number(await indexer.publicClient.getBlockNumber())

    const events = await indexer.fetchEvents(
      currentBlock - 100, // from_block (wider range)
      currentBlock, // to_block
      [CurveEventType.Create, CurveEventType.Buy, CurveEventType.Sell], // event types
      undefined // token_filter (undefined = all tokens)
    )

    console.log(`✅ Found ${events.length} events`)

    // 3. Show first 10 events
    if (events.length > 0) {
      console.log('\n📊 Events (showing first 10):')
      for (const event of events.slice(0, 10)) {
        console.log(`   ${event.type} | Token: ${event.token} | Block: ${event.blockNumber}`)
      }
    }

    // 4. Filter by specific tokens if provided
    if (TOKENS.length > 0) {
      const filteredEvents = await indexer.fetchEvents(
        currentBlock - 100, // Wider range for filtering too
        currentBlock,
        [CurveEventType.Buy, CurveEventType.Sell],
        TOKENS // Only these tokens
      )

      console.log(`\n🎯 Filtered events for specific tokens: ${filteredEvents.length}`)
      console.log(`Target tokens: ${TOKENS.join(', ')}`)

      for (const event of filteredEvents.slice(0, 10)) {
        console.log(`🎯 ${event.type} | Token: ${event.token} | Block: ${event.blockNumber}`)
      }
    } else {
      console.log('\n🎯 No specific tokens provided for filtering')
    }

    // 5. Test fetch_all_events with automatic batching
    console.log('\n🔄 Testing fetch_all_events with automatic batching...')
    const batchSize = 100 // 100 blocks per batch
    const startBlock = currentBlock - 1000

    const allEvents = await indexer.fetchAllEvents(
      startBlock,
      batchSize,
      [CurveEventType.Create, CurveEventType.Buy, CurveEventType.Sell],
      undefined // No token filter for this test
    )

    console.log('📦 Batch processing results:')
    console.log(`   Start block: ${startBlock}`)
    console.log(`   End block: ${currentBlock}`)
    console.log(`   Batch size: ${batchSize} blocks`)
    console.log(`   Total events found: ${allEvents.length}`)

    if (allEvents.length > 0) {
      console.log('\n📊 Events from batch processing (showing first 10):')
      for (const event of allEvents.slice(0, 10)) {
        console.log(`🔄 ${event.type} | Token: ${event.token} | Block: ${event.blockNumber}`)
      }

      // Show unique tokens found in batch processing
      const batchUniqueTokens = new Set<string>()
      for (const event of allEvents) {
        batchUniqueTokens.add(event.token)
      }

      console.log('\n📊 Unique tokens found in batch processing:')
      for (const token of Array.from(batchUniqueTokens)) {
        console.log(`  ${token}`)
      }

      // Event type breakdown
      let createCount = 0
      let buyCount = 0
      let sellCount = 0

      for (const event of allEvents) {
        // Map the actual event types to counters
        if (event.type === 'CurveCreate' || event.type === 'Create') {
          createCount++
        } else if (event.type === 'CurveBuy' || event.type === 'Buy') {
          buyCount++
        } else if (event.type === 'CurveSell' || event.type === 'Sell') {
          sellCount++
        }
        // Other event types (Sync, Lock, Listed) - not counted in main breakdown
      }

      console.log('\n📈 Event type breakdown:')
      console.log(`  Create: ${createCount} events`)
      console.log(`  Buy: ${buyCount} events`)
      console.log(`  Sell: ${sellCount} events`)
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

export { main as executeCurveIndexing }
