/**
 * Advanced Sell Example - Pure Functions for Bots
 *
 * Demonstrates how to use pure functions for maximum speed and control.
 * Perfect for bot developers who want to minimize latency and manage approvals manually.
 *
 * Usage:
 * bun run example:sell-advanced
 * bun run example:sell-advanced -- --token 0xTokenAddress --amount 100
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trade'
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
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const TOKEN_ADDRESS =
  args['token'] || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const AMOUNT_TOKENS = parseUnits(args['amount'] || '100', 18)
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5')

async function executeAdvancedSellExample() {
  console.log('⚡ NADS Fun SDK - Advanced Sell Example (Pure Functions)\n')
  console.log('🤖 Optimized for bots and advanced users who want maximum control')
  console.log('🚀 Features: No automatic reads, manual approval management, minimal latency')
  console.log('')

  try {
    // Initialize instances
    const trade = new Trade(RPC_URL, PRIVATE_KEY)
    // Note: Token instance not used in this advanced example

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${trade.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Amount: ${formatUnits(AMOUNT_TOKENS, 18)}`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`)
    console.log('')

    // === Step 1: Get quote ===
    console.log('📈 Getting sell quote...')
    const quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_TOKENS, false)
    const minMON = (quote.amount * BigInt(100 - SLIPPAGE_PERCENT)) / BigInt(100)

    console.log(`   Router: ${quote.router}`)
    console.log(`   Expected MON: ${formatUnits(quote.amount, 18)}`)
    console.log(`   Minimum MON: ${formatUnits(minMON, 18)}`)
    console.log('')

    // === Method 1: Manual Control (Fastest for bots) ===
    console.log('🤖 Method 1: Manual Control (Recommended for Bots)')
    console.log('   This approach gives you full control and minimizes latency')
    console.log('')

    console.log('   Step 1a: Check allowance (optional - you might already know)')
    const startTime = Date.now()
    const allowance = await trade.checkAllowance(TOKEN_ADDRESS as `0x${string}`, quote.router)
    const allowanceTime = Date.now() - startTime

    console.log(`   Current allowance: ${formatUnits(allowance, 18)}`)
    console.log(`   ⏱️  Allowance check took: ${allowanceTime}ms`)

    const approvalNeeded = allowance < AMOUNT_TOKENS
    let approveTx: string | undefined

    if (approvalNeeded) {
      console.log('   Step 1b: Approve tokens...')
      const approveStart = Date.now()
      approveTx = await trade.approveToken(
        TOKEN_ADDRESS as `0x${string}`,
        quote.router,
        AMOUNT_TOKENS
      )
      const approveTime = Date.now() - approveStart

      console.log(`   ✅ Approval TX: ${approveTx}`)
      console.log(`   ⏱️  Approval took: ${approveTime}ms`)
      console.log('   ⏳ Waiting 3 seconds for approval...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.log('   ✅ Sufficient allowance - no approval needed')
    }

    console.log('   Step 1c: Execute pure sell...')
    const sellStart = Date.now()
    const sellParams = {
      token: TOKEN_ADDRESS as `0x${string}`,
      to: trade.address as `0x${string}`,
      amountIn: AMOUNT_TOKENS,
      amountOutMin: minMON,
    }

    const sellTx = await trade.sell(sellParams, quote.router)
    const sellTime = Date.now() - sellStart

    console.log(`   ✅ Sell TX: ${sellTx}`)
    console.log(`   ⏱️  Pure sell took: ${sellTime}ms`)
    console.log('')

    // === Method 2: Convenience Function (For comparison) ===
    console.log('🔄 Method 2: Convenience Function (For Comparison)')
    console.log('   This is the old behavior - automatic but slower')
    console.log('')

    console.log('   Simulating sellWithApprove() timing...')
    // We won't actually run this since we already executed, just show the pattern
    console.log('   // const result = await trade.sellWithApprove(params, router)')
    console.log('   // This would:')
    console.log('   //   1. Check allowance (automatic)')
    console.log('   //   2. Approve if needed (automatic)')
    console.log('   //   3. Execute sell (automatic)')

    const totalManualTime = allowanceTime + (approvalNeeded ? 3000 : 0) + sellTime
    console.log(`   Manual method total time: ~${totalManualTime}ms`)
    console.log('   Convenience method would be similar but less flexible')
    console.log('')

    // === Advanced Features ===
    console.log('🔧 Advanced Features for Bots:')
    console.log('')

    console.log('   1. 🎯 Pre-computed Nonce Management:')
    console.log('      // For permit transactions')
    console.log(`      const nonce = await trade.getNonce('${TOKEN_ADDRESS}')`)
    console.log('      // Use this nonce in sellPermit params to skip nonce reading')
    console.log('')

    console.log('   2. ⚡ Skip Allowance Checks:')
    console.log('      // If you know allowance is sufficient')
    console.log('      await trade.sell(params, router) // Direct execution')
    console.log('')

    console.log('   3. 🎛️  Custom Gas Management:')
    console.log('      const gasConfig = trade.getGasConfig()')
    console.log('      trade.updateGasConfig({ bondingRouter: { sell: 200000n } })')
    console.log('')

    console.log('   4. 🔄 Batch Operations:')
    console.log('      // Check multiple allowances')
    console.log('      const allowances = await Promise.all([')
    console.log('        trade.checkAllowance(token1, router),')
    console.log('        trade.checkAllowance(token2, router)')
    console.log('      ])')
    console.log('')

    // === Performance Summary ===
    console.log('📊 Performance Analysis:')
    console.log(`   Total execution time: ${totalManualTime}ms`)
    console.log(`   - Allowance check: ${allowanceTime}ms`)
    if (approvalNeeded) {
      console.log(`   - Approval: ~3000ms (waiting time)`)
    }
    console.log(`   - Pure sell: ${sellTime}ms`)
    console.log('')
    console.log('💡 Bot Optimization Tips:')
    console.log('   - Pre-approve tokens during setup to skip approval steps')
    console.log('   - Cache nonces for permit transactions')
    console.log('   - Use WebSocket connections for faster block updates')
    console.log('   - Batch multiple operations when possible')
    console.log('   - Set custom gas limits to avoid estimation delays')

    console.log('\n✅ Advanced sell example completed!')
  } catch (error: any) {
    console.error('❌ Advanced sell example failed:', error)
    if (error.message.includes('allowance')) {
      console.error('💡 Try running with higher allowance or check approval status')
    }
    throw error
  }
}

// Show comparison between approaches
function showMethodComparison() {
  console.log('\n📊 Method Comparison:')
  console.log('')

  console.log('🤖 Manual Control (Method 1):')
  console.log('   ✅ Maximum speed - no unnecessary reads')
  console.log('   ✅ Full control over timing')
  console.log('   ✅ Perfect for bot automation')
  console.log('   ✅ Granular error handling')
  console.log('   ❌ More code to write')
  console.log('   ❌ Need to understand the flow')
  console.log('')

  console.log('🔄 Convenience Function (Method 2):')
  console.log('   ✅ Simple one-line usage')
  console.log('   ✅ Handles edge cases automatically')
  console.log('   ✅ Good for simple applications')
  console.log('   ❌ Automatic reads add latency')
  console.log('   ❌ Less control over execution')
  console.log('   ❌ Harder to optimize')
  console.log('')

  console.log('🎯 Recommendation:')
  console.log('   - Use Manual Control for bots and high-frequency trading')
  console.log('   - Use Convenience Functions for simple apps and testing')
}

// Run the example
if (require.main === module) {
  executeAdvancedSellExample()
    .then(() => showMethodComparison())
    .then(() => {
      console.log('\n🎉 Advanced example completed!')
      console.log('💡 Next steps for bot developers:')
      console.log('   1. Implement allowance pre-approval in your setup')
      console.log('   2. Cache frequently used data (nonces, gas prices)')
      console.log('   3. Use pure functions for production trading')
      console.log('   4. Monitor transaction confirmations separately')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Advanced example failed:', error)
      process.exit(1)
    })
}

export { executeAdvancedSellExample }
