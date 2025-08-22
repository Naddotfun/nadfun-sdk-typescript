/**
 * Pool discovery example
 *
 * Shows how to:
 * 1. Find Uniswap V3 pool addresses for tokens using DexIndexer
 * 2. Auto-discover pools paired with WMON
 *
 * Usage:
 * # Using environment variables
 * export RPC_URL="https://your-rpc-url"
 * export TOKENS="0xToken1,0xToken2"  # Multiple tokens
 * export TOKEN="0xTokenAddress"      # Single token
 * bun run example:pool-discovery
 *
 * # Using command line arguments
 * bun run example:pool-discovery -- --rpc-url https://your-rpc-url --tokens 0xToken1,0xToken2
 * bun run example:pool-discovery -- --rpc-url https://your-rpc-url --token 0xTokenAddress
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { DexIndexer } from '../../src/stream'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'rpc-url': { type: 'string' },
    tokens: { type: 'string' },
    token: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || 'https://testnet-rpc.monad.xyz'
const TOKENS =
  args.tokens?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) ||
  []
const SINGLE_TOKEN = args.token || process.env.TOKEN

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   RPC URL: ${RPC_URL}`)
  console.log('')

  // Determine which tokens to use
  let tokens: `0x${string}`[]

  if (TOKENS.length > 0) {
    tokens = TOKENS as `0x${string}`[]
  } else if (SINGLE_TOKEN) {
    tokens = [SINGLE_TOKEN as `0x${string}`]
  } else {
    // Use example token addresses if none provided
    tokens = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
    ] as `0x${string}`[]
    console.log('⚠️  No tokens provided, using example addresses')
  }

  console.log('🔍 Pool Discovery Example')
  console.log(`Tokens to search: ${tokens.length}`)
  console.log('')

  try {
    // Method 1: Discover all pools at once
    await discoverAllPools(RPC_URL, tokens)

    // Method 2: Discover pools one by one
    await discoverIndividualPools(RPC_URL, tokens)

    console.log('\n✅ Pool discovery completed!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

async function discoverAllPools(rpcUrl: string, tokens: `0x${string}`[]) {
  console.log('📦 Auto Pool Discovery (Batch)')
  console.log('   Finding pools for all tokens at once...')
  console.log('')

  try {
    // DexIndexer automatically finds pools for tokens
    const indexer = await DexIndexer.discoverPoolsForTokens(rpcUrl, tokens)

    const pools = indexer.getPoolAddresses()

    if (pools.length === 0) {
      console.log('   ⚠️  No pools found for any tokens')
      console.log('   💡 Tokens may not have pools with WMON using NADS fee tier')
    } else {
      console.log('   Found pools:')
      pools.forEach((pool, i) => {
        console.log(`     ${i + 1}. Pool: ${pool}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Error discovering pools:', error)
  }

  console.log('')
}

async function discoverIndividualPools(rpcUrl: string, tokens: `0x${string}`[]) {
  console.log('🔧 Individual Pool Discovery')
  console.log('   Finding pools for each token separately...')
  console.log('')

  // Create indexer for each token individually
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    try {
      const indexer = await DexIndexer.discoverPoolsForTokens(rpcUrl, [token])
      const pools = indexer.getPoolAddresses()

      if (pools.length === 0) {
        console.log(`   ${i + 1}. Token ${token}`)
        console.log(`      → No pool found`)
      } else {
        console.log(`   ${i + 1}. Token ${token}`)
        console.log(`      → Pool: ${pools[0]}`)

        // Show additional pool info if available
        if (pools.length > 1) {
          console.log(`      → Additional pools: ${pools.length - 1} more`)
        }
      }
    } catch (error) {
      console.log(`   ${i + 1}. Token ${token}`)
      console.log(`      → Error finding pool: ${error}`)
    }
  }

  console.log('')
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main as executePoolDiscovery }
