/**
 * Buy Tokens Example
 *
 * Usage:
 * bun run example:buy
 * bun run example:buy -- --token 0xTokenAddress --amount 0.1
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trading/trade'
import { formatUnits, parseUnits } from 'viem'
import { monadTestnet } from 'viem/chains'
import { parseArgs } from 'util'
import { calculateMinAmountOut } from '../../src/trading/slippage'

config()

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

const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const PRIVATE_KEY =
  args['private-key'] ||
  process.env.PRIVATE_KEY ||
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const TOKEN_ADDRESS =
  args['token'] || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const AMOUNT_MON = parseUnits(args['amount'] || '0.1', 18)
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5')

async function executeBuyExample() {
  console.log('🛒 NADS Fun SDK - Buy Example\n')

  try {
    const trade = new Trade(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${trade.account.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Amount: ${formatUnits(AMOUNT_MON, 18)} MON`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`)
    console.log('')

    // Check balance
    const monBalance = await trade.publicClient.getBalance({
      address: trade.account.address as `0x${string}`,
    })
    console.log(`💰 Balance: ${formatUnits(monBalance, 18)} MON`)

    if (monBalance < AMOUNT_MON) {
      console.log('❌ Insufficient balance')
      return
    }

    // Check if token is listed
    const isListed = await trade.isListed(TOKEN_ADDRESS as `0x${string}`)
    console.log(`📊 Token listed: ${isListed ? 'Yes (DEX)' : 'No (Bonding Curve)'}`)

    // Get quote
    const quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_MON, true)
    const minTokens = calculateMinAmountOut(quote.amount, SLIPPAGE_PERCENT)

    console.log(`📈 Quote: ${formatUnits(quote.amount, 18)} tokens`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}% (min: ${formatUnits(minTokens, 18)} tokens)`)

    // Determine router type
    const routerType = quote.router.toLowerCase().includes('4fbdc') ? 'bonding' : 'dex'
    console.log(`🔄 Router: ${routerType}`)
    console.log('')

    // Execute buy
    console.log('🛒 Executing buy...')
    const buyParams = {
      token: TOKEN_ADDRESS as `0x${string}`,
      to: trade.account.address as `0x${string}`,
      amountIn: AMOUNT_MON,
      amountOutMin: minTokens,
    }

    const txHash = await trade.buy(buyParams, quote.router)

    console.log('✅ Transaction successful!')
    console.log(`   Hash: ${txHash}`)
    console.log(`   🔗 Explorer: https://testnet.monadexplorer.com/tx/${txHash}`)
  } catch (error) {
    console.error('❌ Transaction failed:', error)
    throw error
  }
}

if (require.main === module) {
  executeBuyExample()
    .then(() => {
      console.log('\n🎉 Buy completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed:', error)
      process.exit(1)
    })
}

export { executeBuyExample }
