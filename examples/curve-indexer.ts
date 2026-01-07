/**
 * Curve Indexer Example
 * Fetches historical bonding curve events from blockchain
 */

import { initSDK } from '../src'
import { network, rpcUrl, privateKey } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)

  // Create curve indexer
  const indexer = sdk.createCurveIndexer()

  // Get recent block (RPC limits to 100 block range)
  const latestBlock = await sdk.publicClient.getBlockNumber()
  const fromBlock = latestBlock - 100n
  const toBlock = latestBlock

  console.log(`Fetching curve events from block ${fromBlock} to ${toBlock}`)

  // Fetch all event types
  const events = await indexer.getEvents({ fromBlock, toBlock })
  console.log(`Found ${events.length} events`)

  // Group by type
  const byType: Record<string, number> = {}
  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1
  }
  console.log('Events by type:', byType)

  // Filter trades
  const trades = await indexer.getEvents({
    fromBlock,
    toBlock,
    eventTypes: ['Buy', 'Sell'],
  })

  console.log(`\nFound ${trades.length} trades (Buy/Sell)`)

  for (const trade of trades.slice(-5)) {
    if (trade.type === 'Buy' || trade.type === 'Sell') {
      console.log(`[${trade.type}]`, {
        token: trade.token,
        sender: trade.sender,
        amountIn: trade.amountIn.toString(),
        amountOut: trade.amountOut.toString(),
      })
    }
  }
}

main().catch(console.error)
