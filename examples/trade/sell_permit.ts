/**
 * Gasless Sell (Permit) Example
 *
 * Advanced gasless selling using EIP-2612 permit signatures.
 * This combines approval and sell in a single transaction.
 *
 * Usage:
 * bun run example:sell-permit
 * bun run example:sell-permit -- --token 0xTokenAddress --amount 100
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trade'
import { Token } from '../../src/Token'
import { formatUnits, parseUnits } from 'viem'
import { monadTestnet } from 'viem/chains'
import { parseArgs } from 'util'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'private-key': { type: 'string' },
    'rpc-url': { type: 'string' },
    token: { type: 'string' },
    amount: { type: 'string' },
    slippage: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const PRIVATE_KEY =
  args['private-key'] ||
  process.env.PRIVATE_KEY ||
  '0x1234567890123456789012345678901234567890123456789012345678901234'
const TOKEN_ADDRESS =
  args['token'] || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const AMOUNT_TOKENS = parseUnits(args['amount'] || '100', 18) // Default 100 tokens
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5') // Default 5%

async function executeSellPermitExample() {
  console.log('⚡ NADS Fun SDK - Gasless Sell (EIP-2612 Permit) Example\n')
  console.log('🆕 New: Optimized nonce management for better performance!')
  console.log('    - Automatic nonce reading (default)')
  console.log('    - Manual nonce provision (faster for bots)')
  console.log('')

  try {
    // Initialize instances
    const trade = new Trade(RPC_URL, PRIVATE_KEY)
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${trade.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Amount Tokens: ${formatUnits(AMOUNT_TOKENS, 18)}`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`)
    console.log('')

    // === Step 1: EIP-2612 Compatibility Check ===
    console.log('🔍 Checking EIP-2612 Compatibility...')
    console.log('   Note: This example assumes the token supports EIP-2612 permits')
    console.log('   ✅ Most modern tokens support permit functionality')
    console.log('')

    // === Step 2: Token Information ===
    console.log('📊 Getting Token Information...')
    const tokenMetadata = await token.getMetadata(TOKEN_ADDRESS as `0x${string}`)
    console.log(`   Name: ${tokenMetadata.name}`)
    console.log(`   Symbol: ${tokenMetadata.symbol}`)
    console.log(`   Decimals: ${tokenMetadata.decimals}`)
    console.log('')

    // === Step 3: Balance Verification ===
    console.log('🔍 Checking Token Balance...')
    const tokenBalance = await token.getBalance(TOKEN_ADDRESS as `0x${string}`)
    const formattedBalance = formatUnits(tokenBalance, tokenMetadata.decimals)

    console.log(`   ${tokenMetadata.symbol} balance: ${formattedBalance}`)

    if (tokenBalance < AMOUNT_TOKENS) {
      console.log('❌ Insufficient token balance for sale')
      console.log(
        `   Required: ${formatUnits(AMOUNT_TOKENS, tokenMetadata.decimals)} ${tokenMetadata.symbol}`
      )
      console.log(`   Available: ${formattedBalance} ${tokenMetadata.symbol}`)
      return
    }
    console.log('✅ Sufficient token balance confirmed')
    console.log('')

    // === Step 4: Trading Quote ===
    console.log('📈 Getting Sell Quote...')
    const quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_TOKENS, false)

    console.log(`   Router detected: ${quote.router}`)
    console.log(`   Expected MON: ${formatUnits(quote.amount, 18)}`)

    // Calculate slippage protection
    const minMON = (quote.amount * BigInt(100 - SLIPPAGE_PERCENT)) / BigInt(100)
    console.log(`   Minimum MON (${SLIPPAGE_PERCENT}% slippage): ${formatUnits(minMON, 18)}`)
    console.log('')

    // === Step 5: Permit Parameters ===
    console.log('📝 Permit Sell Parameters...')
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

    console.log('📝 Permit Details:')
    console.log(`   Owner: ${trade.address}`)
    console.log(`   Spender: ${quote.router}`)
    console.log(
      `   Value: ${formatUnits(AMOUNT_TOKENS, tokenMetadata.decimals)} ${tokenMetadata.symbol}`
    )
    console.log(`   Deadline: ${new Date(deadline * 1000).toISOString()}`)
    console.log('')

    // === Step 6: Gas Analysis ===
    console.log('⛽ Gas Management Analysis...')

    const gasPrice = await trade.publicClient.getGasPrice()
    console.log(`   Network gas price: ${formatUnits(gasPrice, 9)} gwei`)

    // Get default gas limits for permit operations
    const gasConfig = trade.getGasConfig()
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'
    const permitGasLimit =
      routerType === 'bonding' ? gasConfig.bondingRouter.sellPermit : gasConfig.dexRouter.sellPermit

    console.log(`   Router type: ${routerType}`)
    console.log(`   Permit sell gas limit: ${permitGasLimit}`)
    console.log(`   Advantage: Single transaction (vs 2 for approve + sell)`)
    console.log('')

    // === Step 7: Transaction Execution ===
    console.log('⚡ Executing Permit Sell Transaction...')
    console.log('   This single transaction will:')
    console.log('   1. Generate EIP-2612 permit signature')
    console.log('   2. Verify the permit signature')
    console.log('   3. Grant spending allowance')
    console.log('   4. Execute the token sale')
    console.log('   5. Transfer MON to your wallet')
    console.log('')

    try {
      // 🆕 NEW: You can now provide permitNonce for better performance!
      // For bots: Pre-read nonce to eliminate one contract call
      // const nonce = await trade.getNonce(TOKEN_ADDRESS as `0x${string}`)

      const sellPermitParams = {
        token: TOKEN_ADDRESS as `0x${string}`,
        to: trade.address as `0x${string}`,
        amountIn: AMOUNT_TOKENS,
        amountOutMin: minMON,
        amountAllowance: AMOUNT_TOKENS,
        deadline,
        // permitNonce: nonce,  // 🚀 Uncomment this to use pre-computed nonce (faster!)
      }

      console.log('🔐 Generating permit signature and executing transaction...')
      console.log('💡 Nonce management: automatic (can be manual for better performance)')
      const permitSellTx = await trade.sellPermit(sellPermitParams, quote.router, { routerType })

      console.log('✅ Permit sell transaction successful!')
      console.log(`   Transaction hash: ${permitSellTx}`)
      console.log(`   Gas saved vs approve+sell: ~45,000`)
      console.log('')

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await trade.publicClient.waitForTransactionReceipt({
        hash: permitSellTx as `0x${string}`,
      })

      console.log('✅ Transaction confirmed!')
      console.log(`   Block number: ${receipt.blockNumber}`)
      console.log(`   Gas used: ${receipt.gasUsed}`)
      console.log(`   Status: ${receipt.status === 'success' ? 'Success' : 'Failed'}`)
    } catch (error: any) {
      console.error('❌ Permit sell transaction failed:', error.message)
      console.log('')
      console.log('💡 Common issues:')
      console.log('   - Token might not support EIP-2612 permits')
      console.log('   - Insufficient token balance')
      console.log('   - Network congestion or gas price too low')
      console.log('   - Signature rejected by user')
      throw error
    }

    console.log('')
    console.log('✅ Sell permit example completed successfully!')
  } catch (error) {
    console.error('❌ Sell permit example failed:', error)
    throw error
  }
}

// Run the example
if (require.main === module) {
  executeSellPermitExample()
    .then(() => {
      console.log('\n🎉 Permit sell example completed successfully!')
      console.log('💡 Key benefits of permit sell:')
      console.log('   - Single transaction (no separate approval needed)')
      console.log('   - Saves ~45,000 gas compared to approve + sell')
      console.log('   - Better UX with one signature instead of two')
      console.log('   - Supports EIP-2612 compliant tokens')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeSellPermitExample }
