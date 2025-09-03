/**
 * Basic ERC20 token operations example
 *
 * This example demonstrates:
 * 1. Token metadata retrieval (name, symbol, decimals, total supply)
 * 2. Balance checking
 * 3. Allowance management
 * 4. Token transfers
 * 5. Basic error handling
 *
 * Usage:
 * # Using environment variables
 * export PRIVATE_KEY="your_private_key_here"
 * export RPC_URL="https://your-rpc-url"
 * export TOKEN="0xTokenAddress"
 * export RECIPIENT="0xRecipientAddress"
 * bun run example:basic-operation
 *
 * # Using command line arguments
 * bun run example:basic-operation -- --private-key your_private_key_here --rpc-url https://your-rpc-url --token 0xTokenAddress --recipient 0xRecipientAddress
 */

import { config } from 'dotenv'
import { parseArgs } from 'util'
import { formatUnits, parseEther } from 'viem'
import { Token } from '../../src/token/token'

// Load environment variables
config()

// Parse command line arguments
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'private-key': { type: 'string' },
    'rpc-url': { type: 'string' },
    token: { type: 'string' },
    recipient: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || 'https://testnet-rpc.monad.xyz'
const PRIVATE_KEY = args['private-key'] || process.env.PRIVATE_KEY
const TOKEN = args.token || process.env.TOKEN
const RECIPIENT = args.recipient || process.env.RECIPIENT

async function main() {
  // Print configuration
  console.log('📋 Configuration:')
  console.log(`   RPC URL: ${RPC_URL}`)
  if (!PRIVATE_KEY) {
    console.error('⚠️  Private key required for this operation.')
    console.error('   Set it with: --private-key YOUR_PRIVATE_KEY')
    console.error('   Or use environment variable: export PRIVATE_KEY=YOUR_PRIVATE_KEY')
    process.exit(1)
  }
  if (!TOKEN) {
    console.error('⚠️  Token address required for this operation.')
    console.error('   Set it with: --token TOKEN_ADDRESS')
    console.error('   Or use environment variable: export TOKEN=TOKEN_ADDRESS')
    process.exit(1)
  }
  if (!RECIPIENT) {
    console.error('⚠️  Recipient address required for this operation.')
    console.error('   Set it with: --recipient RECIPIENT_ADDRESS')
    console.error('   Or use environment variable: export RECIPIENT=RECIPIENT_ADDRESS')
    process.exit(1)
  }
  console.log('')

  try {
    // Create Token instance
    const tokenHelper = new Token(RPC_URL, PRIVATE_KEY)
    const wallet = tokenHelper.address

    console.log('🪙 Token Helper Basic Operations Demo')
    console.log(`Wallet: ${wallet}`)
    console.log(`Token: ${TOKEN}`)
    console.log(`Recipient: ${RECIPIENT}`)
    console.log('')

    // 1. Get token metadata
    console.log('📋 Getting token metadata...')
    const metadata = await tokenHelper.getMetadata(TOKEN as `0x${string}`)

    console.log(`  Name: ${metadata.name}`)
    console.log(`  Symbol: ${metadata.symbol}`)
    console.log(`  Decimals: ${metadata.decimals}`)
    console.log(`  Total Supply: ${formatUnits(metadata.totalSupply, metadata.decimals)}`)
    console.log('')

    // 2. Check balances
    console.log('💰 Checking balances...')
    const walletBalance = await tokenHelper.getBalance(TOKEN as `0x${string}`)
    const recipientBalance = await tokenHelper.getBalance(
      TOKEN as `0x${string}`,
      RECIPIENT as `0x${string}`
    )

    console.log(
      `  Wallet balance: ${formatUnits(walletBalance, metadata.decimals)} ${metadata.symbol}`
    )
    console.log(
      `  Recipient balance: ${formatUnits(recipientBalance, metadata.decimals)} ${metadata.symbol}`
    )
    console.log('')

    // 3. Check allowances
    console.log('🔐 Checking allowances...')
    const allowanceToRecipient = await tokenHelper.getAllowance(
      TOKEN as `0x${string}`,
      RECIPIENT as `0x${string}`
    )

    console.log(
      `  Allowance (wallet → recipient): ${formatUnits(allowanceToRecipient, metadata.decimals)} ${metadata.symbol}`
    )
    console.log('')

    // 4. Approve tokens (if wallet has balance)
    if (walletBalance > 0n) {
      const approveAmount = parseEther('100') // Approve 100 tokens

      if (walletBalance >= approveAmount) {
        console.log(
          `✅ Approving ${formatUnits(approveAmount, metadata.decimals)} ${metadata.symbol} to recipient...`
        )

        // Note: Actual transaction execution is commented out for safety
        // Uncomment the following lines to execute the approval
        /*
        const approveTx = await tokenHelper.approve(
          TOKEN as `0x${string}`,
          RECIPIENT as `0x${string}`,
          approveAmount
        )
        console.log(`  Approval transaction: ${approveTx}`)
        
        // Wait for transaction to be mined
        console.log('  ⏳ Waiting for approval to be mined...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Check updated allowance
        const updatedAllowance = await tokenHelper.getAllowance(
          TOKEN as `0x${string}`,
          RECIPIENT as `0x${string}`
        )
        console.log(`  Updated allowance: ${formatUnits(updatedAllowance, metadata.decimals)} ${metadata.symbol}`)
        */
        console.log('  ⚠️  Approval transaction commented out for safety')
        console.log('')
      } else {
        console.log('  ⚠️  Insufficient balance for approval demo')
        console.log(
          `  Required: ${formatUnits(approveAmount, metadata.decimals)} ${metadata.symbol}`
        )
        console.log(
          `  Available: ${formatUnits(walletBalance, metadata.decimals)} ${metadata.symbol}`
        )
        console.log('')
      }
    } else {
      console.log('  ⚠️  Wallet has no tokens - skipping approval demo')
      console.log('')
    }

    // 5. Transfer tokens (if wallet has balance)
    if (walletBalance > 0n) {
      const transferAmount =
        walletBalance / 10n > parseEther('10') ? parseEther('10') : walletBalance / 10n // Transfer 10% or 10 tokens max

      if (transferAmount > 0n) {
        console.log(
          `💸 Transferring ${formatUnits(transferAmount, metadata.decimals)} ${metadata.symbol} to recipient...`
        )

        // Note: Actual transaction execution is commented out for safety
        // Uncomment the following lines to execute the transfer
        /*
        const transferTx = await tokenHelper.transfer(
          TOKEN as `0x${string}`,
          RECIPIENT as `0x${string}`,
          transferAmount
        )
        console.log(`  Transfer transaction: ${transferTx}`)
        
        // Wait for transaction to be mined
        console.log('  ⏳ Waiting for transfer to be mined...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Check updated balances
        const newWalletBalance = await tokenHelper.getBalance(TOKEN as `0x${string}`)
        const newRecipientBalance = await tokenHelper.getBalance(
          TOKEN as `0x${string}`,
          RECIPIENT as `0x${string}`
        )
        
        console.log('  Updated balances:')
        console.log(`    Wallet: ${formatUnits(newWalletBalance, metadata.decimals)} ${metadata.symbol} (was ${formatUnits(walletBalance, metadata.decimals)})`)
        console.log(`    Recipient: ${formatUnits(newRecipientBalance, metadata.decimals)} ${metadata.symbol} (was ${formatUnits(recipientBalance, metadata.decimals)})`)
        */
        console.log('  ⚠️  Transfer transaction commented out for safety')
        console.log('')
      } else {
        console.log('  ⚠️  Transfer amount too small - skipping transfer demo')
        console.log('')
      }
    } else {
      console.log('  ⚠️  Wallet has no tokens - skipping transfer demo')
      console.log('')
    }

    // 6. Demonstrate transferFrom (if there's allowance)
    const finalAllowance = await tokenHelper.getAllowance(
      TOKEN as `0x${string}`,
      RECIPIENT as `0x${string}`
    )

    if (finalAllowance > 0n) {
      console.log('📤 TransferFrom demo:')
      console.log(
        `  Available allowance: ${formatUnits(finalAllowance, metadata.decimals)} ${metadata.symbol}`
      )
      console.log("  ℹ️  transferFrom requires the spender's private key")
      console.log('  ℹ️  In practice, this would be called by a smart contract or approved spender')
      console.log('')
    }

    // 7. Additional token utilities (bonus features)
    console.log('🔧 Additional Token Utilities:')

    // Check token health
    const health = await tokenHelper.getTokenHealth(TOKEN as `0x${string}`)
    console.log('  Token Health Check:')
    console.log(`    Is Contract: ${health.isContract ? '✅' : '❌'}`)
    console.log(`    Has Basic Functions: ${health.hasBasicFunctions ? '✅' : '❌'}`)
    console.log('')

    console.log('✅ Token operations demo completed!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main as executeTokenUtilsExample }
