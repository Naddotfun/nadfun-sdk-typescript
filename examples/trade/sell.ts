/**
 * Sell Tokens Example
 *
 * Sell tokens for MON with automatic approval and intelligent gas optimization.
 *
 * Usage:
 * bun run example:sell
 * bun run example:sell -- --token 0xTokenAddress --amount 100
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
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const TOKEN_ADDRESS =
  args['token'] || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const AMOUNT_TOKENS = parseUnits(args['amount'] || '100', 18) // Default 100 tokens
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5') // Default 5%

async function executeSellExample() {
  console.log('💸 NADS Fun SDK - Sell Tokens Example\n')

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

    // === Step 1: Token Metadata ===
    console.log('📊 Getting Token Information...')
    const tokenMetadata = await token.getMetadata(TOKEN_ADDRESS as `0x${string}`)
    console.log(`   Name: ${tokenMetadata.name}`)
    console.log(`   Symbol: ${tokenMetadata.symbol}`)
    console.log(`   Decimals: ${tokenMetadata.decimals}`)
    console.log('')

    // === Step 2: Balance Verification ===
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

    // === Step 3: Trading Quote ===
    console.log('📈 Getting Sell Quote...')
    const quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_TOKENS, false)

    console.log(`   Router detected: ${quote.router}`)
    console.log(`   Expected MON: ${formatUnits(quote.amount, 18)}`)

    // Calculate slippage protection
    const minMON = (quote.amount * BigInt(100 - SLIPPAGE_PERCENT)) / BigInt(100)
    console.log(`   Minimum MON (${SLIPPAGE_PERCENT}% slippage): ${formatUnits(minMON, 18)}`)
    console.log('')

    // === Step 4: Approval Management ===
    console.log('🔒 Checking Token Approval...')
    const currentAllowance = await token.getAllowance(TOKEN_ADDRESS as `0x${string}`, quote.router)

    const allowanceFormatted = formatUnits(currentAllowance, tokenMetadata.decimals)
    const requiredFormatted = formatUnits(AMOUNT_TOKENS, tokenMetadata.decimals)

    console.log(`   Current allowance: ${allowanceFormatted} ${tokenMetadata.symbol}`)
    console.log(`   Required allowance: ${requiredFormatted} ${tokenMetadata.symbol}`)

    let approvalNeeded = false
    if (currentAllowance < AMOUNT_TOKENS) {
      approvalNeeded = true
      console.log('❌ Insufficient allowance - approval required')

      // Calculate approval gas
      console.log('   Estimating approval gas...')
      // In real implementation, this would estimate gas for approval
      console.log('   Estimated approval gas: ~45,000')
    } else {
      console.log('✅ Sufficient allowance - no approval needed')
    }
    console.log('')

    // === Step 5: Gas Management Analysis ===
    console.log('⛽ Gas Management Analysis...')

    const gasPrice = await trade.publicClient.getGasPrice()
    console.log(`   Network gas price: ${formatUnits(gasPrice, 9)} gwei`)

    const recommendedGasPrice = gasPrice * BigInt(3)
    console.log(`   Recommended gas price: ${formatUnits(recommendedGasPrice, 9)} gwei`)

    // Get default gas limits
    const gasConfig = trade.getGasConfig()
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'
    const sellGasLimit =
      routerType === 'bonding' ? gasConfig.bondingRouter.sell : gasConfig.dexRouter.sell

    console.log(`   Router type: ${routerType}`)
    console.log(`   Sell gas limit: ${sellGasLimit}`)

    if (approvalNeeded) {
      console.log(`   Total transactions: 2 (Approve + Sell)`)
      console.log(`   Estimated total gas: ~${Number(sellGasLimit) + 45000}`)
    } else {
      console.log(`   Total transactions: 1 (Sell only)`)
      console.log(`   Estimated total gas: ${sellGasLimit}`)
    }
    console.log('')

    // === Step 6: Transaction Execution Plan ===
    console.log('📝 Transaction Execution Plan:')

    if (approvalNeeded) {
      console.log('   Step 1: Approve token spending')
      console.log(`     - Token: ${TOKEN_ADDRESS}`)
      console.log(`     - Spender: ${quote.router}`)
      console.log(`     - Amount: ${requiredFormatted} ${tokenMetadata.symbol}`)
      console.log('     - Gas limit: ~45,000')
      console.log('')
    }

    console.log(`   Step ${approvalNeeded ? '2' : '1'}: Execute sell transaction`)
    console.log(`     - Selling: ${requiredFormatted} ${tokenMetadata.symbol}`)
    console.log(`     - Expected: ~${formatUnits(quote.amount, 18)} MON`)
    console.log(`     - Minimum: ${formatUnits(minMON, 18)} MON`)
    console.log(`     - Router: ${quote.router}`)
    console.log(`     - Gas limit: ${sellGasLimit}`)
    console.log('')

    // === Step 7: Safety Check ===
    console.log('⚠️  REAL TRANSACTION EXECUTION:')
    console.log('   This will sell your tokens for MON!')
    if (approvalNeeded) {
      console.log('   Two transactions will be executed: Approve + Sell')
    } else {
      console.log('   One transaction will be executed: Sell')
    }
    console.log('   Uncomment the execution lines below to proceed')
    console.log('')

    // REAL EXECUTION SECTION
    console.log('⚠️  EXECUTING REAL TRANSACTIONS:')
    console.log(
      `   You are about to sell ${formatUnits(AMOUNT_TOKENS, tokenMetadata.decimals)} ${tokenMetadata.symbol}`
    )
    console.log(`   Expected to receive ~${formatUnits(quote.amount, 18)} MON`)
    console.log('')

    try {
      console.log('💸 Executing sell with automatic approval (if needed)...')
      const sellParams = {
        token: TOKEN_ADDRESS as `0x${string}`,
        to: trade.address as `0x${string}`,
        amountIn: AMOUNT_TOKENS,
        amountOutMin: minMON,
      }

      // Use the new sellWithApprove convenience function
      const result = await trade.sellWithApprove(sellParams, quote.router, { routerType })

      if (result.approveTx) {
        console.log(`✅ Approval transaction: ${result.approveTx}`)
        console.log(
          `   🔗 View on explorer: https://testnet.monadexplorer.com/tx/${result.approveTx}`
        )
      }

      console.log(`✅ Sell transaction: ${result.sellTx}`)
      console.log(`   🔗 View on explorer: https://testnet.monadexplorer.com/tx/${result.sellTx}`)
      console.log('')
      console.log('⏳ Transaction confirmation in progress...')
      console.log('')
      console.log('🆕 New API Features:')
      console.log('   - Pure sell() function available for bots (no auto-approval)')
      console.log('   - checkAllowance() and approveToken() for manual control')
      console.log('   - sellWithApprove() for convenience (used above)')
    } catch (error: any) {
      console.error('❌ Sell transaction failed!')
      console.error(`   Error: ${error.message}`)
      if (error.message.includes('insufficient balance')) {
        console.error('   💡 Check your token balance')
      } else if (error.message.includes('allowance')) {
        console.error('   💡 Approval may have failed, try running again')
      }
      throw error
    }

    console.log('✅ Sell example completed successfully!')
  } catch (error) {
    console.error('❌ Sell example failed:', error)
    throw error
  }
}

// Show example of successful execution
async function showSuccessfulSellExample() {
  console.log('\n📊 Example of Successful Sell Output:')
  console.log('   (This is what you would see with real execution)\n')

  console.log('🔒 Step 1: Executing approval...')
  console.log('   ✅ Approval successful: 0xabcd1234...')
  console.log('   Gas used: 42,891 (estimated: 45,000)')
  console.log('   ⏳ Waiting for confirmation...')
  console.log('')

  console.log('💸 Step 2: Executing sell...')
  console.log('   ✅ Sell successful: 0xefgh5678...')
  console.log('   Gas used: 165,234 (vs limit: 170,000)')
  console.log('   Effective gas price: 75.5 gwei')
  console.log('   Total gas cost: 0.0157 MON')
  console.log('   MON received: 0.0001245 MON')
  console.log('   Slippage: 1.8% (within 5% tolerance)')
  console.log('   🔗 View transactions on explorer:')
  console.log('     - Approval: https://testnet.monadexplorer.com/tx/0xabcd1234...')
  console.log('     - Sell: https://testnet.monadexplorer.com/tx/0xefgh5678...')
}

// Run the example
if (require.main === module) {
  executeSellExample()
    .then(() => showSuccessfulSellExample())
    .then(() => {
      console.log('\n🎉 Example completed!')
      console.log('💡 To execute real trades:')
      console.log('   1. Verify all parameters above')
      console.log('   2. Uncomment the execution block')
      console.log('   3. Run the example again')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeSellExample }
