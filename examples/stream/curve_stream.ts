/**
 * Bonding curve real-time streaming example
 *
 * Demonstrates 3 different streaming scenarios:
 * 1. All bonding curve events (all event types, all tokens)
 * 2. Specific event types only
 * 3. Specific tokens only
 *
 * Usage:
 * # Scenario 1: All events
 * bun run example:curve-stream -- --ws-url wss://your-ws-url
 *
 * # Scenario 2: Specific events only (Buy/Sell)
 * bun run example:curve-stream -- --ws-url wss://your-ws-url --events Buy,Sell
 *
 * # Scenario 3: Specific tokens only
 * bun run example:curve-stream -- --ws-url wss://your-ws-url --tokens 0xToken1,0xToken2
 *
 * # Combined: Specific events AND tokens
 * bun run example:curve-stream -- --ws-url wss://your-ws-url --events Buy,Sell --tokens 0xToken1
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { Stream as CurveStream } from '../../src/stream/curve/stream'
import { CurveEventType, BondingCurveEvent } from '../../src/types'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'ws-url': { type: 'string' },
    events: { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const WS_URL = args['ws-url'] || process.env.WS_RPC_URL
const EVENTS =
  args.events?.split(',').map(e => e.trim()) ||
  process.env.EVENTS?.split(',').map(e => e.trim()) ||
  []
const TOKENS =
  args.tokens?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) ||
  []

let eventCount = 0

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   WS URL: ${WS_URL}`)
  if (EVENTS.length > 0) {
    console.log(`   Events: ${EVENTS.join(', ')}`)
  }
  if (TOKENS.length > 0) {
    console.log(`   Tokens: ${TOKENS.join(', ')}`)
  }
  console.log('')

  if (!WS_URL) {
    console.error('❌ WebSocket URL is required')
    console.log('💡 Usage: --ws-url wss://your-ws-url')
    process.exit(1)
  }

  try {
    // Parse event types if provided
    const eventFilter = EVENTS.length > 0 ? EVENTS.map(e => e as CurveEventType) : null
    const tokenFilter = TOKENS.length > 0 ? TOKENS : null

    // Determine scenario
    if (!eventFilter && !tokenFilter) {
      console.log('🌟 SCENARIO 1: All bonding curve events (all types, all tokens)')
      await runAllEventsScenario(WS_URL)
    } else if (eventFilter && !tokenFilter) {
      console.log(`🎯 SCENARIO 2: Specific event types only: ${eventFilter.join(', ')}`)
      await runSpecificEventsScenario(WS_URL, eventFilter)
    } else if (!eventFilter && tokenFilter) {
      console.log(`🏷️ SCENARIO 3: Specific tokens only: ${tokenFilter.length} tokens`)
      await runSpecificTokensScenario(WS_URL, tokenFilter)
    } else if (eventFilter && tokenFilter) {
      console.log(
        `🎯🏷️ COMBINED: Specific events ${eventFilter.join(', ')} AND ${tokenFilter.length} tokens`
      )
      await runCombinedScenario(WS_URL, eventFilter, tokenFilter)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Scenario 1: All bonding curve events
async function runAllEventsScenario(wsUrl: string) {
  console.log('📡 Creating CurveStream for all events...')

  const curveStream = new CurveStream(wsUrl)

  const onEvent = curveStream.onEvent(event => {
    handleEvent(event, 'ALL')
  })

  console.log('🔴 Listening for ALL bonding curve events...')
  await curveStream.start()

  setupGracefulShutdown(curveStream, onEvent)
  await keepRunning()
}

// Scenario 2: Specific event types only
async function runSpecificEventsScenario(wsUrl: string, eventTypes: CurveEventType[]) {
  console.log('📡 Creating CurveStream for specific events...')

  const curveStream = new CurveStream(wsUrl)
  curveStream.subscribeEvents(eventTypes)

  const onEvent = curveStream.onEvent(event => {
    handleEvent(event, 'FILTERED_EVENTS')
  })

  console.log(`🎯 Listening for specific events: ${eventTypes.join(', ')}`)
  await curveStream.start()

  setupGracefulShutdown(curveStream, onEvent)
  await keepRunning()
}

// Scenario 3: Specific tokens only
async function runSpecificTokensScenario(wsUrl: string, monitoredTokens: string[]) {
  console.log('📡 Creating CurveStream for specific tokens...')

  const curveStream = new CurveStream(wsUrl)
  curveStream.filterTokens(monitoredTokens)

  const onEvent = curveStream.onEvent(event => {
    handleEvent(event, 'FILTERED_TOKENS')
  })

  console.log(`🏷️ Listening for ${monitoredTokens.length} specific tokens`)
  monitoredTokens.forEach((token, i) => {
    console.log(`   ${i + 1}. ${token}`)
  })

  await curveStream.start()

  setupGracefulShutdown(curveStream, onEvent)
  await keepRunning()
}

// Combined scenario: Specific events AND tokens
async function runCombinedScenario(
  wsUrl: string,
  eventTypes: CurveEventType[],
  monitoredTokens: string[]
) {
  console.log('📡 Creating CurveStream for specific events AND tokens...')

  const curveStream = new CurveStream(wsUrl)
  curveStream.subscribeEvents(eventTypes)
  curveStream.filterTokens(monitoredTokens)

  const onEvent = curveStream.onEvent(event => {
    handleEvent(event, 'COMBINED_FILTER')
  })

  console.log(
    `🎯🏷️ Listening for ${eventTypes.join(', ')} events on ${monitoredTokens.length} tokens`
  )
  await curveStream.start()

  setupGracefulShutdown(curveStream, onEvent)
  await keepRunning()
}

function handleEvent(event: BondingCurveEvent, scenario: string) {
  eventCount++
  console.log(
    `🎉 [${scenario}] ${event.type} event for token ${event.token} | Block: ${event.blockNumber} | TX: ${event.transactionHash}`
  )

  switch (event.type) {
    case CurveEventType.Create:
      console.log('   ✨ New token created!')
      break
    case CurveEventType.Buy:
      console.log('   💰 Buy transaction detected')
      break
    case CurveEventType.Sell:
      console.log('   💸 Sell transaction detected')
      break
    case CurveEventType.Sync:
      console.log('   🔄 Sync event')
      break
    case CurveEventType.Lock:
      console.log('   🔒 Lock event')
      break
    case CurveEventType.Listed:
      console.log('   🚀 Token listed on DEX!')
      break
  }
}

function setupGracefulShutdown(stream: CurveStream, unsubscribe: () => void) {
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
}

async function keepRunning() {
  console.log('✅ Stream active! Monitoring bonding curve events...')
  console.log('💡 Execute transactions on the bonding curve to see live events')
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

export { main as runCurveStreamExample }
