/**
 * Sell Tokens Example
 *
 * Usage:
 * bun run example:sell
 * bun run example:sell -- --token 0xTokenAddress --amount 100
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trading/trade'
import { Token } from '../../src/token/token'
import { formatUnits, maxUint256, parseUnits } from 'viem'
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
const AMOUNT_TOKENS = parseUnits(args['amount'] || '100', 18)
const SLIPPAGE_PERCENT = Number(args['slippage'] || '30')

async function executeSellExample() {
  console.log('💸 NADS Fun SDK - Sell Example\n')

  try {
    const trade = new Trade(RPC_URL, PRIVATE_KEY)
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${trade.account.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Amount: ${formatUnits(AMOUNT_TOKENS, 18)}`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`)
    console.log('')

    // Get token metadata
    const tokenMetadata = await token.getMetadata(TOKEN_ADDRESS as `0x${string}`)
    console.log(`📊 Token: ${tokenMetadata.name} (${tokenMetadata.symbol})`)

    // Check balance
    const tokenBalance = await token.getBalance(TOKEN_ADDRESS as `0x${string}`)
    const formattedBalance = formatUnits(tokenBalance, tokenMetadata.decimals)
    console.log(`💰 Balance: ${formattedBalance} ${tokenMetadata.symbol}`)

    if (tokenBalance < AMOUNT_TOKENS) {
      console.log('❌ Insufficient balance')
      return
    }

    // Get quote
    const quote = await trade.getAmountOut(TOKEN_ADDRESS as `0x${string}`, AMOUNT_TOKENS, false)

    const minMON = calculateMinAmountOut(quote.amount, SLIPPAGE_PERCENT)

    console.log(`📈 Quote: ${formatUnits(quote.amount, 18)} MON`)
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}% (min: ${formatUnits(minMON, 18)} MON)`)

    // Check allowance
    const currentAllowance = await token.getAllowance(TOKEN_ADDRESS as `0x${string}`, quote.router)
    const needsApproval = currentAllowance < AMOUNT_TOKENS

    console.log(`🔒 Allowance: ${needsApproval ? 'Required' : 'Sufficient'}`)

    // Determine router type
    const isListed = await trade.isListed(TOKEN_ADDRESS as `0x${string}`)
    const routerType = isListed ? 'dex' : 'bonding'
    console.log(`🔄 Router: ${routerType}`)
    console.log('')

    // Execute approval if needed
    if (needsApproval) {
      console.log('🔒 Approving token...')
      const approveTx = await token.approve(
        TOKEN_ADDRESS as `0x${string}`,
        quote.router,
        maxUint256
      )
      console.log(`   Approval: ${approveTx}`)
      console.log(`   🔗 Explorer: https://testnet.monadexplorer.com/tx/${approveTx}`)
    }

    // Execute sell
    console.log('💸 Executing sell...')
    const sellParams = {
      token: TOKEN_ADDRESS as `0x${string}`,
      to: trade.account.address as `0x${string}`,
      amountIn: AMOUNT_TOKENS,
      amountOutMin: minMON,
    }

    const sellTx = await trade.sell(sellParams, quote.router)

    console.log('✅ Transaction successful!')
    console.log(`   Hash: ${sellTx}`)
    console.log(`   🔗 Explorer: https://testnet.monadexplorer.com/tx/${sellTx}`)
  } catch (error) {
    console.error('❌ Transaction failed:', error)
    throw error
  }
}

if (require.main === module) {
  executeSellExample()
    .then(() => {
      console.log('\n🎉 Sell completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed:', error)
      process.exit(1)
    })
}

export { executeSellExample }
