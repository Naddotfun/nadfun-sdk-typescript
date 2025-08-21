/**
 * Gasless Sell (Permit) Example
 *
 * Usage:
 * bun run example:sell-permit
 * bun run example:sell-permit -- --token 0xTokenAddress --amount 100
 */

import { config } from 'dotenv'
import { Trade } from '../../src/trading/trade'
import { Token } from '../../src/token/token'
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
  '0x1234567890123456789012345678901234567890123456789012345678901234'
const TOKEN_ADDRESS =
  args['token'] || process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const AMOUNT_TOKENS = parseUnits(args['amount'] || '100', 18)
const SLIPPAGE_PERCENT = Number(args['slippage'] || '5')

async function executeSellPermitExample() {
  console.log('⚡ NADS Fun SDK - Sell Permit Example\n')

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

    // Determine router type
    const isListed = await trade.isListed(TOKEN_ADDRESS as `0x${string}`)
    const routerType = isListed ? 'dex' : 'bonding'
    console.log(`🔄 Router: ${routerType}`)

    const deadline = Math.floor(Date.now() / 1000) + 3600

    // Execute permit sell
    console.log('⚡ Executing permit sell...')

    const signature = await token.generatePermitSignature(
      TOKEN_ADDRESS as `0x${string}`,
      quote.router,
      AMOUNT_TOKENS,
      BigInt(deadline)
    )

    const sellPermitParams = {
      token: TOKEN_ADDRESS as `0x${string}`,
      to: trade.account.address as `0x${string}`,
      amountIn: AMOUNT_TOKENS,
      amountOutMin: minMON,
      amountAllowance: AMOUNT_TOKENS,
      deadline,
      v: signature.v,
      r: signature.r,
      s: signature.s,
    }

    const permitSellTx = await trade.sellPermit(sellPermitParams, quote.router)

    console.log('✅ Transaction successful!')
    console.log(`   Hash: ${permitSellTx}`)
    console.log(`   🔗 Explorer: https://testnet.monadexplorer.com/tx/${permitSellTx}`)

    // Wait for confirmation
    const receipt = await trade.publicClient.waitForTransactionReceipt({
      hash: permitSellTx as `0x${string}`,
    })

    console.log(`   Block: ${receipt.blockNumber}`)
    console.log(`   Gas used: ${receipt.gasUsed}`)
  } catch (error) {
    console.error('❌ Transaction failed:', error)
    throw error
  }
}

if (require.main === module) {
  executeSellPermitExample()
    .then(() => {
      console.log('\n🎉 Sell permit completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed:', error)
      process.exit(1)
    })
}

export { executeSellPermitExample }
