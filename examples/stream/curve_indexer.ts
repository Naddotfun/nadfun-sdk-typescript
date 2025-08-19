/**
 * Bonding Curve Event Indexing Example
 *
 * Historical bonding curve event analysis with batch processing.
 * Fetches and analyzes Create, Buy, Sell, Sync, Lock, and Listed events.
 *
 * Usage:
 * npm run example:curve-indexer
 * npm run example:curve-indexer -- --tokens 0xToken1,0xToken2
 * npm run example:curve-indexer -- --from-block 1000000 --to-block 1010000
 */

import { config } from 'dotenv'
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'
import { Indexer as CurveIndexer } from '../../src/stream/curve/indexer'
import { CurveEventType } from '../../src/stream/curve/types'
import type { BondingCurveEvent } from '../../src/stream/curve/types'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    tokens: { type: 'string' },
    'from-block': { type: 'string' },
    'to-block': { type: 'string' },
    events: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const TOKEN_FILTER = args['tokens']?.split(',').map(t => t.trim()) || []
// Use recent blocks that are more likely to have events
const currentBlock = 4000000 // Approximate recent block
const FROM_BLOCK = Number(args['from-block'] || (currentBlock - 1000).toString())
const TO_BLOCK = Number(args['to-block'] || currentBlock.toString())
const EVENT_FILTER = args['events']?.split(',').map(e => e.trim() as CurveEventType) || [
  CurveEventType.Buy,
  CurveEventType.Sell,
]

async function executeCurveIndexing() {
  console.log('📊 NADS Pump SDK - Bonding Curve Event Indexer\n')

  try {
    // Initialize client and indexer
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http(RPC_URL),
    })

    const indexer = new CurveIndexer(client)

    console.log('📋 Indexing Configuration:')
    console.log(`   RPC URL: ${RPC_URL}`)
    console.log(`   Block range: ${FROM_BLOCK} → ${TO_BLOCK}`)
    console.log(
      `   Token filter: ${TOKEN_FILTER.length > 0 ? TOKEN_FILTER.join(', ') : 'All tokens'}`
    )
    console.log(`   Event filter: ${EVENT_FILTER.join(', ')}`)
    console.log('')

    // === Step 1: Fetch Events ===
    console.log('📚 Fetching Historical Events...')
    console.log(`   Block range: ${FROM_BLOCK} to ${TO_BLOCK}`)
    console.log('   This may take a moment for large ranges...')
    console.log('')

    const startTime = Date.now()

    // Use fetchEvents for specific range or fetchAllEvents for batching
    let events: BondingCurveEvent[]
    if (TO_BLOCK - FROM_BLOCK > 10000) {
      // Use batching for large ranges
      events = await indexer.fetchAllEvents(FROM_BLOCK, 1000, EVENT_FILTER, TOKEN_FILTER)
    } else {
      // Direct fetch for smaller ranges
      events = await indexer.fetchEvents(FROM_BLOCK, TO_BLOCK, EVENT_FILTER, TOKEN_FILTER)
    }

    const fetchTime = Date.now() - startTime

    console.log(`✅ Fetched ${events.length} events in ${fetchTime}ms`)
    console.log('')

    // === Step 3: Event Analysis ===
    if (events.length === 0) {
      console.log('ℹ️  No events found in the specified range')
      console.log('   Try expanding the block range or removing filters')
      return
    }

    console.log('📊 Event Analysis:')

    // Count by event type
    const eventCounts = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log('\n   📈 Event Distribution:')
    Object.entries(eventCounts).forEach(([type, count]) => {
      const percentage = ((count / events.length) * 100).toFixed(1)
      console.log(`     ${type}: ${count} events (${percentage}%)`)
    })

    // Unique tokens analysis
    const uniqueTokens = [...new Set(events.map(e => e.token))]
    console.log(`\n   🪙 Token Analysis:`)
    console.log(`     Unique tokens: ${uniqueTokens.length}`)
    if (uniqueTokens.length > 0) {
      console.log(`     Events per token: ${(events.length / uniqueTokens.length).toFixed(1)} avg`)
    }

    // Time range analysis
    const timestamps = events
      .map(e => (e.timestamp ? Number(e.timestamp) : 0))
      .filter(t => t > 0)
      .sort((a, b) => a - b)

    if (timestamps.length > 0) {
      const firstEvent = new Date(timestamps[0] * 1000)
      const lastEvent = new Date(timestamps[timestamps.length - 1] * 1000)
      const timeRange = (timestamps[timestamps.length - 1] - timestamps[0]) / 3600 // hours

      console.log(`\n   ⏰ Time Range Analysis:`)
      console.log(`     First event: ${firstEvent.toISOString()}`)
      console.log(`     Last event: ${lastEvent.toISOString()}`)
      console.log(`     Time span: ${timeRange.toFixed(1)} hours`)
      if (timeRange > 0) {
        console.log(`     Events per hour: ${(events.length / timeRange).toFixed(1)} avg`)
      }
    }
    console.log('')

    // === Step 4: Detailed Event Examples ===
    console.log('🔍 Sample Events (Latest 5):')
    const sampleEvents = events.slice(-5).reverse() // Latest 5, newest first

    sampleEvents.forEach((event, index) => {
      console.log(`\n   ${index + 1}. ${event.type} Event:`)
      console.log(`      Token: ${event.token}`)
      console.log(`      Block: ${event.blockNumber}`)
      if (event.timestamp) {
        console.log(`      Timestamp: ${new Date(Number(event.timestamp) * 1000).toISOString()}`)
      }
      console.log(`      Transaction: ${event.transactionHash}`)

      // Show event-specific data
      if (event.type === 'Buy' && 'buyer' in event) {
        console.log(`      Buyer: ${event.buyer}`)
        console.log(`      Amount In: ${event.amountIn}`)
        console.log(`      Amount Out: ${event.amountOut}`)
      } else if (event.type === 'Sell' && 'seller' in event) {
        console.log(`      Seller: ${event.seller}`)
        console.log(`      Amount In: ${event.amountIn}`)
        console.log(`      Amount Out: ${event.amountOut}`)
      } else if (event.type === 'Create' && 'creator' in event) {
        console.log(`      Creator: ${event.creator}`)
        console.log(`      Target Amount: ${event.targetTokenAmount}`)
      }
    })

    // === Step 5: Statistics Summary ===
    console.log('\n📋 Indexing Summary:')
    console.log(`   Total events processed: ${events.length}`)
    console.log(`   Unique tokens: ${uniqueTokens.length}`)
    console.log(`   Block range: ${FROM_BLOCK} to ${TO_BLOCK}`)
    console.log(`   Fetch time: ${fetchTime}ms`)
    if (events.length > 0) {
      console.log(`   Average time per event: ${(fetchTime / events.length).toFixed(2)}ms`)
    }
    console.log('')

    // === Step 6: Export Options ===
    console.log('💾 Export Options:')
    console.log('   The events can be processed further:')
    console.log('   - Save to JSON file')
    console.log('   - Export to CSV for analysis')
    console.log('   - Stream to database')
    console.log('   - Calculate trading metrics')
    console.log('')

    // Example: Show how to save events
    console.log('   Example: Save to JSON file')
    console.log('   const fs = require("fs")')
    console.log('   fs.writeFileSync("events.json", JSON.stringify(events, null, 2))')

    console.log('\n✅ Bonding curve indexing completed successfully!')
  } catch (error) {
    console.error('❌ Curve indexing failed:', error)
    throw error
  }
}

// Show usage examples
function showUsageExamples() {
  console.log('\n📚 Usage Examples:')
  console.log('')

  console.log('1. 🌐 Index all events from recent blocks:')
  console.log('   npm run example:curve-indexer')
  console.log('')

  console.log('2. 🎯 Filter specific tokens:')
  console.log('   npm run example:curve-indexer -- --tokens 0xToken1,0xToken2,0xToken3')
  console.log('')

  console.log('3. 📅 Specific block range:')
  console.log('   npm run example:curve-indexer -- --from-block 1500000 --to-block 1600000')
  console.log('')

  console.log('4. 🎪 Filter event types:')
  console.log('   npm run example:curve-indexer -- --events Buy,Sell,Create')
  console.log('')

  console.log('5. 🎛️  Combined filtering:')
  console.log(
    '   npm run example:curve-indexer -- --tokens 0xToken1 --events Buy,Sell --from-block 1500000'
  )
  console.log('')

  console.log('📊 Available Event Types:')
  console.log('   - Create: New token launches')
  console.log('   - Buy: Token purchases')
  console.log('   - Sell: Token sales')
  console.log('   - Sync: Price/liquidity updates')
  console.log('   - Lock: Token locks')
  console.log('   - Listed: DEX listings')
}

// Run the example
if (require.main === module) {
  executeCurveIndexing()
    .then(() => showUsageExamples())
    .then(() => {
      console.log('\n🎉 Example completed!')
      console.log('💡 Next steps:')
      console.log('   - Process events for trading analysis')
      console.log('   - Set up real-time monitoring with curve_stream')
      console.log('   - Export data for external analysis')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeCurveIndexing }
