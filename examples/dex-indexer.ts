/**
 * DEX Indexer Example
 * Fetches historical swap events from graduated token pools
 */

import { initSDK, createDexIndexerWithTokens } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Finding pool for token:', tokenAddress)

  // Create DEX indexer - automatically discovers pool from token
  const indexer = await createDexIndexerWithTokens(rpcUrl, [tokenAddress], network)

  console.log('Watching pools:', indexer.pools)

  // Get recent block (RPC limits to 100 block range)
  const latestBlock = await sdk.publicClient.getBlockNumber()
  const fromBlock = latestBlock - 100n
  const toBlock = latestBlock

  console.log(`Fetching DEX swap events from block ${fromBlock} to ${toBlock}`)

  // Fetch swap events
  const swaps = await indexer.getSwapEvents({ fromBlock, toBlock })
  console.log(`Found ${swaps.length} swaps`)

  for (const swap of swaps.slice(-10)) {
    console.log('[Swap]', {
      pool: swap.pool,
      sender: swap.sender,
      recipient: swap.recipient,
      amount0: swap.amount0.toString(),
      amount1: swap.amount1.toString(),
      blockNumber: swap.blockNumber.toString(),
    })
  }
}

main().catch(console.error)
