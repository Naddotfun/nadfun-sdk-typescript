/**
 * DEX Event Indexing Example
 *
 * Historical Uniswap V3 swap event analysis with batch processing.
 * Discovers pools for tokens and analyzes swap events with detailed statistics.
 *
 * Usage:
 * bun run example:dex-indexer
 * bun run example:dex-indexer -- --tokens 0xToken1,0xToken2
 * bun run example:dex-indexer -- --from-block 1000000 --to-block 1010000
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { monadTestnet } from 'viem/chains'
import { DexIndexer } from '../../src/stream'
import { SwapEvent } from '../../src/types'

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
    'from-block': { type: 'string' },
    'to-block': { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const POOL_ADDRESSES = (args.pools?.split(',').map(p => p.trim()) || []) as `0x${string}`[]
const TOKEN_ADDRESSES =
  args.tokens?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) ||
  []
// Use recent blocks that are more likely to have swap events
const currentBlock = 4000000 // Approximate recent block
const FROM_BLOCK = Number(args['from-block'] || (currentBlock - 100).toString())
const TO_BLOCK = Number(args['to-block'] || currentBlock.toString())

async function executeDexIndexing() {
  console.log('🏊 NADS Fun SDK - DEX Event Indexer\n')

  try {
    let indexer: any

    if (POOL_ADDRESSES.length > 0) {
      // Use provided pool addresses directly
      console.log('📍 Using provided pool addresses...')
      indexer = new DexIndexer(RPC_URL, POOL_ADDRESSES)
      console.log(`   Pools: ${POOL_ADDRESSES.length} addresses`)
    } else if (TOKEN_ADDRESSES.length > 0) {
      // Discover pools for token addresses
      console.log('🔍 Discovering pools for token addresses...')
      console.log(`   Tokens: ${TOKEN_ADDRESSES.join(', ')}`)
      indexer = await DexIndexer.discoverPoolsForTokens(RPC_URL, TOKEN_ADDRESSES as `0x${string}`[])

      const discoveredPools = indexer.getPoolAddresses()
      console.log(`   Discovered pools: ${discoveredPools.length}`)
      if (discoveredPools.length === 0) {
        console.log('   ⚠️  No pools found for the specified tokens')
        console.log('   💡 Try providing pool addresses directly with --pools')
        return
      }
    } else {
      console.log('❌ No pool addresses or token addresses provided')
      console.log('💡 Usage options:')
      console.log('   bun run example:dex-indexer -- --tokens 0xToken1,0xToken2')
      console.log('   bun run example:dex-indexer -- --pools 0xPool1,0xPool2')
      return
    }

    console.log('\n📋 Indexing Configuration:')
    console.log(`   RPC URL: ${RPC_URL}`)
    console.log(`   Block range: ${FROM_BLOCK} → ${TO_BLOCK}`)
    console.log(`   Pool addresses: ${indexer.getPoolAddresses().length}`)
    console.log('')

    // === Step 1: Fetch Events ===
    console.log('📚 Fetching Historical Swap Events...')
    console.log(`   Block range: ${FROM_BLOCK} to ${TO_BLOCK}`)
    console.log('   This may take a moment for large ranges...')
    console.log('')

    const startTime = Date.now()

    // Use fetchEvents for specific range or fetchAllEvents for batching
    let events: SwapEvent[]
    if (TO_BLOCK - FROM_BLOCK > 10000) {
      // Use batching for large ranges
      events = await indexer.fetchAllEvents(FROM_BLOCK, 100)
    } else {
      // Direct fetch for smaller ranges
      events = await indexer.fetchEvents(FROM_BLOCK, TO_BLOCK)
    }

    const fetchTime = Date.now() - startTime

    console.log(`✅ Fetched ${events.length} swap events in ${fetchTime}ms`)
    console.log('')

    // === Step 2: Event Analysis ===
    if (events.length === 0) {
      console.log('ℹ️  No swap events found in the specified range')
      console.log('   Try expanding the block range or providing different pools/tokens')
      return
    }

    console.log('📊 Swap Event Analysis:')

    // Unique pools analysis
    const uniquePools = Array.from(new Set(events.map(e => e.pool)))
    console.log(`\n   🏊 Pool Analysis:`)
    console.log(`     Unique pools: ${uniquePools.length}`)
    if (uniquePools.length > 0) {
      console.log(`     Swaps per pool: ${(events.length / uniquePools.length).toFixed(1)} avg`)
    }

    // Unique traders analysis
    const uniqueTraders = Array.from(
      new Set([...events.map(e => e.sender), ...events.map(e => e.recipient)])
    )
    console.log(`\n   👥 Trader Analysis:`)
    console.log(`     Unique addresses: ${uniqueTraders.length}`)
    if (uniqueTraders.length > 0) {
      console.log(
        `     Swaps per address: ${(events.length / uniqueTraders.length).toFixed(1)} avg`
      )
    }

    // Volume analysis (simplified)
    const totalAmount0 = events.reduce((sum, e) => sum + Math.abs(Number(e.amount0)), 0)
    const totalAmount1 = events.reduce((sum, e) => sum + Math.abs(Number(e.amount1)), 0)
    console.log(`\n   💰 Volume Analysis:`)
    console.log(`     Total Amount0 volume: ${totalAmount0.toLocaleString()}`)
    console.log(`     Total Amount1 volume: ${totalAmount1.toLocaleString()}`)
    console.log(`     Average Amount0 per swap: ${(totalAmount0 / events.length).toFixed(2)}`)
    console.log(`     Average Amount1 per swap: ${(totalAmount1 / events.length).toFixed(2)}`)

    // Block range analysis
    const blockNumbers = events.map(e => Number(e.blockNumber)).sort((a, b) => a - b)
    if (blockNumbers.length > 0) {
      const firstBlock = blockNumbers[0]
      const lastBlock = blockNumbers[blockNumbers.length - 1]
      const blockSpan = lastBlock - firstBlock

      console.log(`\n   📊 Block Analysis:`)
      console.log(`     First swap block: ${firstBlock}`)
      console.log(`     Last swap block: ${lastBlock}`)
      console.log(`     Block span: ${blockSpan} blocks`)
      if (blockSpan > 0) {
        console.log(`     Swaps per block: ${(events.length / blockSpan).toFixed(2)} avg`)
      }
    }
    console.log('')

    // === Step 3: Detailed Event Examples ===
    console.log('🔍 Sample Swap Events (Latest 5):')
    const sampleEvents = events.slice(-5).reverse() // Latest 5, newest first

    sampleEvents.forEach((event, index) => {
      console.log(`\n   ${index + 1}. Swap Event:`)
      console.log(`      Pool: ${event.pool}`)
      console.log(`      Block: ${event.blockNumber}`)
      console.log(`      Sender: ${event.sender}`)
      console.log(`      Recipient: ${event.recipient}`)
      console.log(`      Amount0: ${event.amount0}`)
      console.log(`      Amount1: ${event.amount1}`)
      console.log(`      Liquidity: ${event.liquidity}`)
      console.log(`      Tick: ${event.tick}`)
      console.log(`      Transaction: ${event.transactionHash}`)
    })

    // === Step 4: Statistics Summary ===
    console.log('\n📋 Indexing Summary:')
    console.log(`   Total swaps processed: ${events.length}`)
    console.log(`   Unique pools: ${uniquePools.length}`)
    console.log(`   Unique addresses: ${uniqueTraders.length}`)
    console.log(`   Block range: ${FROM_BLOCK} to ${TO_BLOCK}`)
    console.log(`   Fetch time: ${fetchTime}ms`)
    if (events.length > 0) {
      console.log(`   Average time per swap: ${(fetchTime / events.length).toFixed(2)}ms`)
    }
    console.log('')

    // === Step 5: Export Options ===
    console.log('💾 Export Options:')
    console.log('   The swap events can be processed further:')
    console.log('   - Save to JSON file')
    console.log('   - Export to CSV for analysis')
    console.log('   - Stream to database')
    console.log('   - Calculate trading metrics')
    console.log('')

    // Example: Show how to save events
    console.log('   Example: Save to JSON file')
    console.log('   const fs = require("fs")')
    console.log('   fs.writeFileSync("swap_events.json", JSON.stringify(events, null, 2))')

    console.log('\n✅ DEX indexing completed successfully!')
  } catch (error) {
    console.error('❌ DEX indexing failed:', error)
    process.exit(1)
  }
}

// Show usage examples
function showUsageExamples() {
  console.log('\n📚 Usage Examples:')
  console.log('')

  console.log('1. 🌐 Index swaps from recent blocks:')
  console.log('   bun run example:dex-indexer')
  console.log('')

  console.log('2. 🎯 Filter specific tokens (auto pool discovery):')
  console.log('   bun run example:dex-indexer -- --tokens 0xToken1,0xToken2,0xToken3')
  console.log('')

  console.log('3. 📍 Monitor specific pools directly:')
  console.log('   bun run example:dex-indexer -- --pools 0xPool1,0xPool2')
  console.log('')

  console.log('4. 📅 Specific block range:')
  console.log('   bun run example:dex-indexer -- --from-block 1500000 --to-block 1600000')
  console.log('')

  console.log('5. 🎛️  Combined filtering:')
  console.log(
    '   bun run example:dex-indexer -- --tokens 0xToken1 --from-block 1500000 --to-block 1600000'
  )
  console.log('')

  console.log('6. 🌐 Custom RPC:')
  console.log('   bun run example:dex-indexer -- --rpc-url https://custom-rpc.com')
  console.log('')

  console.log('📊 DEX Pool Discovery Info:')
  console.log('   - Automatically finds WMON pairs with NADS 1% fee tier')
  console.log('   - Uses V3 Factory for pool discovery')
  console.log('   - Monitors Uniswap V3 Swap events')
  console.log('')

  console.log('💡 Analysis Features:')
  console.log('   - Pool-level swap statistics')
  console.log('   - Trader activity analysis')
  console.log('   - Volume and liquidity metrics')
  console.log('   - Block distribution analysis')
  console.log('   - Sample event details')
}

// Run the example
if (require.main === module) {
  executeDexIndexing()
    .then(() => showUsageExamples())
    .then(() => {
      console.log('\n🎉 Example completed!')
      console.log('💡 Next steps:')
      console.log('   - Process events for trading analysis')
      console.log('   - Set up real-time monitoring with dex_stream')
      console.log('   - Export data for external analysis')
      console.log('   - Calculate arbitrage opportunities')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeDexIndexing }
