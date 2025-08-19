/**
 * Gas Estimation Utility Example
 *
 * Advanced gas estimation and optimization tools for NADS Fun SDK operations.
 * Helps determine optimal gas settings for different market conditions.
 *
 * Usage:
 * bun run example:gas-estimator
 * bun run example:gas-estimator -- --token 0xTokenAddress --operation buy
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trade'
import { Token } from '../../src/token'
import { formatUnits, parseUnits, formatGwei } from 'viem'
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
    operation: { type: 'string' },
    amount: { type: 'string' },
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
const OPERATION = args['operation'] || 'buy' // buy, sell, approve, transfer
const AMOUNT = parseUnits(args['amount'] || '0.1', 18)

async function executeGasEstimation() {
  console.log('⛽ NADS Fun SDK - Advanced Gas Estimation Tool\n')

  try {
    // Initialize instances
    const trade = new Trade(RPC_URL, PRIVATE_KEY)
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Gas Analysis Configuration:')
    console.log(`   Wallet: ${trade.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Operation: ${OPERATION}`)
    console.log(`   Amount: ${formatUnits(AMOUNT, 18)}`)
    console.log('')

    // === Step 1: Network Gas Analysis ===
    console.log('🌐 Network Gas Price Analysis:')

    const currentGasPrice = await trade.publicClient.getGasPrice()
    console.log(`   Current base fee: ${formatGwei(currentGasPrice)} gwei`)

    // Calculate different gas price strategies
    const strategies = {
      slow: currentGasPrice,
      standard: currentGasPrice * BigInt(2),
      fast: currentGasPrice * BigInt(3),
      instant: currentGasPrice * BigInt(5),
    }

    console.log('   🎯 Gas Price Strategies:')
    Object.entries(strategies).forEach(([name, price]) => {
      const priority = name.charAt(0).toUpperCase() + name.slice(1)
      console.log(`     ${priority}: ${formatGwei(price)} gwei`)
    })
    console.log('')

    // === Step 2: Default Gas Limits ===
    console.log('🏭 Default Gas Limit Analysis:')

    const gasConfig = trade.getGasConfig()
    console.log('   🔗 Bonding Router Limits:')
    console.log(`     Buy: ${gasConfig.bondingRouter.buy.toLocaleString()}`)
    console.log(`     Sell: ${gasConfig.bondingRouter.sell.toLocaleString()}`)
    console.log(`     Sell Permit: ${gasConfig.bondingRouter.sellPermit.toLocaleString()}`)

    console.log('   🏪 DEX Router Limits:')
    console.log(`     Buy: ${gasConfig.dexRouter.buy.toLocaleString()}`)
    console.log(`     Sell: ${gasConfig.dexRouter.sell.toLocaleString()}`)
    console.log(`     Sell Permit: ${gasConfig.dexRouter.sellPermit.toLocaleString()}`)
    console.log('')

    // === Step 3: Operation-Specific Analysis ===
    console.log(`📊 ${OPERATION.toUpperCase()} Operation Analysis:`)

    if (OPERATION === 'buy') {
      await analyzeBuyOperation(trade, TOKEN_ADDRESS, AMOUNT)
    } else if (OPERATION === 'sell') {
      await analyzeSellOperation(trade, token, TOKEN_ADDRESS, AMOUNT)
    } else if (OPERATION === 'approve') {
      await analyzeApproveOperation(token, TOKEN_ADDRESS, AMOUNT)
    } else if (OPERATION === 'transfer') {
      await analyzeTransferOperation(token, TOKEN_ADDRESS, AMOUNT)
    } else {
      console.log('   ❌ Unsupported operation. Use: buy, sell, approve, transfer')
      return
    }

    // === Step 4: Gas Cost Calculations ===
    console.log('💰 Gas Cost Analysis:')

    // Use buy operation as example for cost calculation
    const exampleGasUsed = gasConfig.bondingRouter.buy

    console.log('   📊 Estimated costs for different strategies:')
    Object.entries(strategies).forEach(([name, price]) => {
      const costFormatted = formatUnits(exampleGasUsed * price, 18)
      console.log(`     ${name}: ${costFormatted.slice(0, 8)} MON`)
    })
    console.log('')

    // === Step 5: Optimization Recommendations ===
    console.log('🎯 Gas Optimization Recommendations:')
    console.log('')

    console.log('   ⚡ Quick Strategies:')
    console.log('     • Use standard gas for normal conditions')
    console.log('     • Use fast gas during high network activity')
    console.log('     • Use slow gas for non-urgent transactions')
    console.log('     • Monitor network congestion before trading')
    console.log('')

    console.log('   🛠️  Advanced Optimizations:')
    console.log('     • Batch multiple operations when possible')
    console.log('     • Use permit signatures for gasless approvals')
    console.log('     • Consider transaction timing during low activity')
    console.log('     • Pre-approve tokens during low gas periods')
    console.log('')

    console.log('   📊 Market Timing:')
    console.log('     • Network typically slower during US business hours')
    console.log('     • Weekends often have lower gas prices')
    console.log('     • Early morning UTC usually most efficient')
    console.log('     • Monitor DeFi activity for congestion spikes')

    console.log('\n✅ Gas estimation analysis completed!')
  } catch (error) {
    console.error('❌ Gas estimation failed:', error)
    throw error
  }
}

// Analyze buy operation gas requirements
async function analyzeBuyOperation(trade: Trade, tokenAddress: string, amount: bigint) {
  try {
    console.log('   🛒 Buy Operation Details:')

    // Get quote to determine router
    const quote = await trade.getAmountOut(tokenAddress as `0x${string}`, amount, true)
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'

    console.log(`     Router: ${quote.router} (${routerType})`)
    console.log(`     Expected tokens: ${formatUnits(quote.amount, 18)}`)

    const gasConfig = trade.getGasConfig()
    const recommendedGas =
      routerType === 'bonding' ? gasConfig.bondingRouter.buy : gasConfig.dexRouter.buy

    console.log(`     Recommended gas limit: ${recommendedGas.toLocaleString()}`)
    console.log('     Transaction complexity: Medium (single contract call)')
    console.log('     Risk of failure: Low (with sufficient balance)')
  } catch {
    console.log('     ❌ Could not analyze buy operation (token might not be listed)')
  }
}

// Analyze sell operation gas requirements
async function analyzeSellOperation(
  trade: Trade,
  token: Token,
  tokenAddress: string,
  amount: bigint
) {
  try {
    console.log('   💸 Sell Operation Details:')

    // Check if approval is needed
    const quote = await trade.getAmountOut(tokenAddress as `0x${string}`, amount, false)
    const allowance = await token.getAllowance(tokenAddress as `0x${string}`, quote.router)

    const needsApproval = allowance < amount
    const gasConfig = trade.getGasConfig()
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'

    console.log(`     Router: ${quote.router} (${routerType})`)
    console.log(`     Expected MON: ${formatUnits(quote.amount, 18)}`)
    console.log(`     Needs approval: ${needsApproval ? '✅ Yes' : '❌ No'}`)

    const sellGas =
      routerType === 'bonding' ? gasConfig.bondingRouter.sell : gasConfig.dexRouter.sell

    const totalGas = needsApproval ? sellGas + BigInt(45000) : sellGas

    console.log(`     Sell gas limit: ${sellGas.toLocaleString()}`)
    if (needsApproval) {
      console.log(`     Approval gas: ~45,000`)
      console.log(`     Total gas needed: ${totalGas.toLocaleString()}`)
    }
    console.log(
      `     Transaction complexity: ${needsApproval ? 'High (2 transactions)' : 'Medium (1 transaction)'}`
    )
  } catch {
    console.log('     ❌ Could not analyze sell operation (insufficient data)')
  }
}

// Analyze approve operation gas requirements
async function analyzeApproveOperation(token: Token, tokenAddress: string, amount: bigint) {
  console.log('   📝 Approve Operation Details:')
  console.log(`     Token: ${tokenAddress}`)
  console.log(`     Amount: ${formatUnits(amount, 18)}`)
  console.log('     Estimated gas: ~45,000')
  console.log('     Transaction complexity: Low (simple ERC20 call)')
  console.log('     Risk of failure: Very low')
  console.log('     Optimization tip: Use infinite approval to avoid repeated costs')
}

// Analyze transfer operation gas requirements
async function analyzeTransferOperation(token: Token, tokenAddress: string, amount: bigint) {
  console.log('   💸 Transfer Operation Details:')
  console.log(`     Token: ${tokenAddress}`)
  console.log(`     Amount: ${formatUnits(amount, 18)}`)
  console.log('     Estimated gas: ~21,000 - 65,000')
  console.log('     Transaction complexity: Low (simple ERC20 call)')
  console.log('     Risk of failure: Low (with sufficient balance)')
  console.log('     Note: Gas varies based on recipient type (EOA vs contract)')
}

// Show gas monitoring tips
function showGasMonitoringTips() {
  console.log('\n⚡ Gas Monitoring Best Practices:')
  console.log('')

  console.log('📊 Monitoring Tools:')
  console.log('   • Check current gas prices before transactions')
  console.log('   • Use gas trackers for network congestion alerts')
  console.log('   • Monitor your transaction pool for pending status')
  console.log('   • Set up gas price alerts for optimal timing')
  console.log('')

  console.log('🎯 Optimization Strategies:')
  console.log('   • Queue non-urgent transactions for low-gas periods')
  console.log('   • Use higher gas prices during market volatility')
  console.log('   • Consider gas refunds from certain operations')
  console.log('   • Batch multiple operations when possible')
  console.log('')

  console.log('🚨 Warning Signs:')
  console.log('   • Gas prices 3x above normal indicate congestion')
  console.log('   • Failed transactions waste gas - verify parameters first')
  console.log('   • Out-of-gas errors mean insufficient gas limit')
  console.log('   • Pending transactions may need gas price increases')
}

// Run the example
if (require.main === module) {
  executeGasEstimation()
    .then(() => showGasMonitoringTips())
    .then(() => {
      console.log('\n🎉 Gas analysis completed!')
      console.log('💡 Use these insights to optimize your transaction costs')
      console.log('📊 Run with different operations for comprehensive analysis:')
      console.log('   bun run example:gas-estimator -- --operation buy')
      console.log('   bun run example:gas-estimator -- --operation sell')
      console.log('   bun run example:gas-estimator -- --operation approve')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Gas estimation failed:', error)
      process.exit(1)
    })
}

export { executeGasEstimation }
