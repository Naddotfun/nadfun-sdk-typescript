/**
 * Curve Stream Example
 * Real-time bonding curve events
 */

import { initSDK } from '../src'
import { network, rpcUrl, wsUrl, privateKey } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)

  // Create curve stream
  const stream = sdk.createCurveStream(wsUrl)

  // Subscribe to events
  stream.onEvent((event) => {
    console.log(`[${event.type}]`, event)
  })

  stream.onError((error) => {
    console.error('Stream error:', error)
  })

  // Filter by event types
  stream.filterEventTypes(['Create', 'Buy', 'Sell'])

  // Start streaming
  stream.start()
  console.log('Streaming started... Press Ctrl+C to stop')

  // Keep alive
  process.on('SIGINT', () => {
    stream.stop()
    console.log('Stream stopped')
    process.exit(0)
  })
}

main().catch(console.error)
