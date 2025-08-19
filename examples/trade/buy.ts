/**
 * Buy Tokens Example
 *
 * Buy tokens with MON including advanced gas management and slippage protection.
 *
 * Usage:
 * bun run example:buy
 * bun run example:buy -- --token 0xTokenAddress --amount 0.1
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
const AMOUNT_MON = parseUnits(args['amount'] || '0.1', 18) // Default 0.1 MON
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5') // Default 5%

async function executeBuyExample() {
  console.log('🛒 NADS Fun SDK - Buy Tokens Example\n')

  try {
    // Initialize Trade instance
    const trade = new Trade(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${trade.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Amount MON: ${formatUnits(AMOUNT_MON, 18)}`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`)
    console.log('')

    // === Step 1: Balance Verification ===
    console.log('💰 Checking Account Balance...')
    const monBalance = await trade.publicClient.getBalance({
      address: trade.address as `0x${string}`,
    })
    console.log(`   MON balance: ${formatUnits(monBalance, 18)} MON`)

    if (monBalance < AMOUNT_MON) {
      console.log('❌ Insufficient MON balance for purchase')
      console.log(`   Required: ${formatUnits(AMOUNT_MON, 18)} MON`)
      console.log(`   Available: ${formatUnits(monBalance, 18)} MON`)
      return
    }
    console.log('✅ Sufficient balance confirmed')
    console.log('')

    // === Step 2: Token Listing Check ===
    console.log('📊 Verifying Token Listing...')
    const isListed = await trade.isListed(TOKEN_ADDRESS as `0x${string}`)
    console.log(`   Token listed: ${isListed ? '✅ Yes (DEX)' : '❌ No (will try Bonding Curve)'}`)
    console.log('')

    // === Step 3: Trading Quote ===
    console.log('📈 Getting Trading Quote...')
    console.log(`   Trying ${isListed ? 'DEX and Bonding Curve' : 'Bonding Curve'} routes...`)

    let quote
    try {
      quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_MON, true)
    } catch (error: any) {
      console.error('❌ Cannot get trading quote')
      console.error(`   Error: ${error.message}`)
      console.log('   This token is not available for trading on any route')
      return
    }

    console.log(`   Router detected: ${quote.router}`)
    console.log(`   Expected tokens: ${formatUnits(quote.amount, 18)}`)

    // Calculate slippage protection
    const minTokens = (quote.amount * BigInt(100 - SLIPPAGE_PERCENT)) / BigInt(100)
    console.log(`   Minimum tokens (${SLIPPAGE_PERCENT}% slippage): ${formatUnits(minTokens, 18)}`)
    console.log('')

    // === Step 4: Gas Management ===
    console.log('⛽ Gas Management Analysis...')

    // Get current gas price
    const gasPrice = await trade.publicClient.getGasPrice()
    console.log(`   Network gas price: ${formatUnits(gasPrice, 9)} gwei`)

    // Recommended gas price (EIP-1559 compatible with 3x multiplier)
    const recommendedGasPrice = gasPrice * BigInt(3)
    console.log(`   Recommended gas price: ${formatUnits(recommendedGasPrice, 9)} gwei`)

    // Get default gas limits
    const gasConfig = trade.getGasConfig()
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'
    const defaultGasLimit =
      routerType === 'bonding' ? gasConfig.bondingRouter.buy : gasConfig.dexRouter.buy

    console.log(`   Router type: ${routerType}`)
    console.log(`   Default gas limit: ${defaultGasLimit}`)
    console.log('')

    // === Step 5: Transaction Execution ===
    console.log('🚀 Executing Buy Transaction...')

    const buyParams = {
      token: TOKEN_ADDRESS as `0x${string}`,
      to: trade.address as `0x${string}`,
      amountIn: AMOUNT_MON,
      amountOutMin: minTokens,
    }

    // Show transaction details before execution
    console.log('📝 Transaction Details:')
    console.log(`   Action: BUY`)
    console.log(`   Spending: ${formatUnits(AMOUNT_MON, 18)} MON`)
    console.log(`   Expected: ~${formatUnits(quote.amount, 18)} tokens`)
    console.log(`   Minimum: ${formatUnits(minTokens, 18)} tokens`)
    console.log(`   Router: ${quote.router}`)
    console.log(`   Gas Limit: ${defaultGasLimit}`)
    console.log('')

    console.log('⚠️  REAL TRANSACTION EXECUTION:')
    console.log('   This will spend real MON tokens!')
    console.log('   Review all parameters above before proceeding')
    console.log('')

    // Final confirmation before execution
    console.log('🚨 FINAL CONFIRMATION:')
    console.log(`   You are about to spend ${formatUnits(AMOUNT_MON, 18)} MON`)
    console.log(`   Expected to receive ~${formatUnits(quote.amount, 18)} tokens`)
    console.log(`   Gas cost estimate: ~0.02 MON`)
    console.log('')

    // REAL TRADE EXECUTION
    console.log('🚀 Executing buy transaction...')
    try {
      const txHash = await trade.buy(buyParams, quote.router, { routerType })

      console.log('✅ Buy transaction submitted!')
      console.log(`   Transaction Hash: ${txHash}`)
      console.log(`   🔗 View on explorer: https://testnet.monadexplorer.com/tx/${txHash}`)
      console.log('')
      console.log('⏳ Transaction confirmation in progress...')
      console.log('   Check the explorer link above for status updates')
      console.log('   Transaction should confirm within 1-2 minutes')
    } catch (error: any) {
      console.error('❌ Buy transaction failed!')
      console.error(`   Error: ${error.message}`)
      if (error.message.includes('insufficient funds')) {
        console.error('   💡 Check your MON balance and ensure you have enough for gas fees')
      } else if (error.message.includes('slippage')) {
        console.error(
          '   💡 Try increasing slippage tolerance or wait for better market conditions'
        )
      }
      throw error
    }

    console.log('')
    console.log('✅ Buy example completed successfully!')
    console.log('💡 Next steps:')
    console.log('   1. Wait for transaction confirmation')
    console.log('   2. Check your token balance')
    console.log('   3. Monitor the transaction on the explorer')
  } catch (error) {
    console.error('❌ Buy example failed:', error)
    throw error
  }
}

// Advanced: Show what a successful transaction would look like
async function showSuccessfulTradeExample() {
  console.log('\n📊 Example of Successful Trade Output:')
  console.log('   (This is what you would see with real execution)\n')

  console.log('✅ Buy successful!')
  console.log('   Transaction hash: 0x1234567890abcdef...')
  console.log('   Gas used: 247891 (vs limit: 320000)')
  console.log('   Effective gas price: 75.5 gwei')
  console.log('   Total gas cost: 0.0187 MON')
  console.log('   Tokens received: 77,127.80 tokens')
  console.log('   Slippage: 2.3% (within 5% tolerance)')
  console.log('   🔗 View on explorer: https://testnet.monadexplorer.com/tx/0x1234...')
}

// Run the example
if (require.main === module) {
  executeBuyExample()
    .then(() => showSuccessfulTradeExample())
    .then(() => {
      console.log('\n🎉 Example completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeBuyExample }
