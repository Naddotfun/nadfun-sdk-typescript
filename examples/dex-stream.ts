/**
 * DEX Stream Example
 * Real-time swap events from graduated token pools
 */

import { createDexStreamWithTokens } from '../src'
import { network, rpcUrl, wsUrl, tokenAddress } from './common'

async function main() {
  console.log('Network:', network)
  console.log('Finding pool for token:', tokenAddress)

  // Create DEX stream - automatically discovers pool from token
  const stream = await createDexStreamWithTokens(wsUrl, rpcUrl, [tokenAddress], network)

  console.log('Watching pools:', stream.pools)

  // Subscribe to swap events
  stream.onSwap((event) => {
    console.log('[Swap]', {
      pool: event.pool,
      sender: event.sender,
      recipient: event.recipient,
      amount0: event.amount0.toString(),
      amount1: event.amount1.toString(),
    })
  })

  stream.onError((error) => {
    console.error('Stream error:', error)
  })

  // Start streaming
  stream.start()
  console.log('DEX streaming started... Press Ctrl+C to stop')

  // Keep alive
  process.on('SIGINT', () => {
    stream.stop()
    console.log('Stream stopped')
    process.exit(0)
  })
}

main().catch(console.error)
