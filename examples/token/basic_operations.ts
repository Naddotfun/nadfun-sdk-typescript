/**
 * Basic ERC20 Operations Example
 *
 * Comprehensive ERC20 token interaction patterns including metadata,
 * balances, allowances, and transfers.
 *
 * Usage:
 * npm run example:basic-ops
 * npm run example:basic-ops -- --token 0xTokenAddress --recipient 0xRecipientAddress
 */

import { config } from 'dotenv'
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
    recipient: { type: 'string' },
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
const RECIPIENT_ADDRESS =
  args['recipient'] || process.env.RECIPIENT || '0xD47Dd1a82dd239688ECE1BA94D86f3D32960C339'
const TRANSFER_AMOUNT = parseUnits(args['amount'] || '10', 18) // Default 10 tokens

async function executeBasicOperations() {
  console.log('🪙 NADS Pump SDK - Basic ERC20 Operations Example\n')

  try {
    // Initialize Token instance
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${token.address}`)
    console.log(`   Token: ${TOKEN_ADDRESS}`)
    console.log(`   Recipient: ${RECIPIENT_ADDRESS}`)
    console.log('')

    // === Step 1: Token Metadata Retrieval ===
    console.log('📊 Step 1: Token Metadata Retrieval')
    console.log('   Fetching comprehensive token information...\n')

    const metadata = await token.getMetadata(TOKEN_ADDRESS as `0x${string}`)

    console.log('   📋 Token Information:')
    console.log(`     Name: ${metadata.name}`)
    console.log(`     Symbol: ${metadata.symbol}`)
    console.log(`     Decimals: ${metadata.decimals}`)
    console.log(`     Total Supply: ${formatUnits(metadata.totalSupply, metadata.decimals)}`)
    console.log(`     Contract Address: ${metadata.address}`)

    // Calculate market cap info (for educational purposes)
    const totalSupplyFormatted = formatUnits(metadata.totalSupply, metadata.decimals)
    console.log('\n   📈 Supply Analytics:')
    console.log(`     Total Tokens: ${Number(totalSupplyFormatted).toLocaleString()}`)
    console.log(`     Decimals: ${metadata.decimals} (standard: 18)`)
    console.log('')

    // === Step 2: Balance Operations ===
    console.log('💰 Step 2: Balance Operations')
    console.log('   Checking balances for multiple addresses...\n')

    // Check your balance
    const [yourBalance, yourFormatted] = await token.getBalanceFormatted(
      TOKEN_ADDRESS as `0x${string}`
    )
    console.log(`   👤 Your Balance:`)
    console.log(`     Raw: ${yourBalance.toString()}`)
    console.log(`     Formatted: ${yourFormatted} ${metadata.symbol}`)

    // Check recipient balance
    const [recipientBalance, recipientFormatted] = await token.getBalanceFormatted(
      TOKEN_ADDRESS as `0x${string}`,
      RECIPIENT_ADDRESS as `0x${string}`
    )
    console.log(`\n   🎯 Recipient Balance (${RECIPIENT_ADDRESS}):`)
    console.log(`     Raw: ${recipientBalance.toString()}`)
    console.log(`     Formatted: ${recipientFormatted} ${metadata.symbol}`)

    // Calculate percentage of total supply
    if (metadata.totalSupply > BigInt(0)) {
      const yourPercent = (Number(yourBalance) / Number(metadata.totalSupply)) * 100
      const recipientPercent = (Number(recipientBalance) / Number(metadata.totalSupply)) * 100

      console.log(`\n   📊 Supply Distribution:`)
      console.log(`     Your holdings: ${yourPercent.toFixed(6)}% of total supply`)
      console.log(`     Recipient holdings: ${recipientPercent.toFixed(6)}% of total supply`)
    }
    console.log('')

    // === Step 3: Allowance Management ===
    console.log('📝 Step 3: Allowance Management')
    console.log('   Managing token spending permissions...\n')

    // Check current allowance
    const currentAllowance = await token.getAllowance(
      TOKEN_ADDRESS as `0x${string}`,
      RECIPIENT_ADDRESS as `0x${string}`
    )

    const allowanceFormatted = formatUnits(currentAllowance, metadata.decimals)
    console.log(`   🔍 Current Allowance for ${RECIPIENT_ADDRESS}:`)
    console.log(`     Raw: ${currentAllowance.toString()}`)
    console.log(`     Formatted: ${allowanceFormatted} ${metadata.symbol}`)

    // Demonstrate approval (commented for safety)
    const approvalAmount = parseUnits('50', metadata.decimals) // 50 tokens
    const approvalFormatted = formatUnits(approvalAmount, metadata.decimals)

    console.log(`\n   📋 Planned Approval:`)
    console.log(`     Spender: ${RECIPIENT_ADDRESS}`)
    console.log(`     Amount: ${approvalFormatted} ${metadata.symbol}`)
    console.log(`     Purpose: Allow spender to transfer tokens on your behalf`)

    console.log('\n   ⚠️  Executing real approval transaction...')

    try {
      console.log('   ✍️  Executing approval...')
      const approvalTx = await token.approve(
        TOKEN_ADDRESS as `0x${string}`,
        RECIPIENT_ADDRESS as `0x${string}`,
        approvalAmount
      )
      console.log(`     ✅ Approval transaction: ${approvalTx}`)
      console.log(`     🔗 View on explorer: https://testnet.monadexplorer.com/tx/${approvalTx}`)

      // Wait for confirmation
      console.log('     ⏳ Waiting for confirmation...')
      await new Promise(resolve => setTimeout(resolve, 15000))

      // Check updated allowance
      const newAllowance = await token.getAllowance(
        TOKEN_ADDRESS as `0x${string}`,
        RECIPIENT_ADDRESS as `0x${string}`
      )
      const newAllowanceFormatted = formatUnits(newAllowance, metadata.decimals)
      console.log(`     📊 Updated allowance: ${newAllowanceFormatted} ${metadata.symbol}`)
    } catch (error: any) {
      console.error(`     ❌ Approval failed: ${error.message}`)
    }
    console.log('')

    // === Step 4: Smart Approval Management ===
    console.log('🛡️  Step 4: Smart Approval Management')
    console.log('   Demonstrating checkAndApprove functionality...\n')

    const requiredAmount = parseUnits('25', metadata.decimals)
    const requiredFormatted = formatUnits(requiredAmount, metadata.decimals)

    console.log(`   🎯 Required Amount: ${requiredFormatted} ${metadata.symbol}`)
    console.log(`   🔍 Current Allowance: ${allowanceFormatted} ${metadata.symbol}`)

    if (currentAllowance >= requiredAmount) {
      console.log(`   ✅ Sufficient allowance - no approval needed`)
    } else {
      console.log(`   ❌ Insufficient allowance - approval would be needed`)
      console.log(`   📋 checkAndApprove would:`)
      console.log(`     1. Detect insufficient allowance`)
      console.log(`     2. Calculate optimal approval amount`)
      console.log(`     3. Execute approval transaction`)
      console.log(`     4. Return transaction hash or null`)
    }

    console.log('\n   🛡️  Executing smart approval check...')

    try {
      const smartApprovalTx = await token.checkAndApprove(
        TOKEN_ADDRESS as `0x${string}`,
        RECIPIENT_ADDRESS as `0x${string}`,
        requiredAmount,
        { forceNew: false } // Only approve if needed
      )

      if (smartApprovalTx) {
        console.log(`     ✅ Smart approval executed: ${smartApprovalTx}`)
        console.log(
          `     🔗 View on explorer: https://testnet.monadexplorer.com/tx/${smartApprovalTx}`
        )
      } else {
        console.log(`     ✅ No approval needed - current allowance sufficient`)
      }
    } catch (error: any) {
      console.error(`     ❌ Smart approval failed: ${error.message}`)
    }
    console.log('')

    // === Step 5: Token Transfer Operations ===
    console.log('💸 Step 5: Token Transfer Operations')
    console.log('   Safe token transfer workflow...\n')

    const transferFormatted = formatUnits(TRANSFER_AMOUNT, metadata.decimals)

    console.log(`   📋 Planned Transfer:`)
    console.log(`     From: ${token.address}`)
    console.log(`     To: ${RECIPIENT_ADDRESS}`)
    console.log(`     Amount: ${transferFormatted} ${metadata.symbol}`)

    // Balance check
    if (yourBalance >= TRANSFER_AMOUNT) {
      console.log(`   ✅ Sufficient balance for transfer`)
      console.log(`   📊 After transfer:`)
      console.log(
        `     Your balance: ${formatUnits(yourBalance - TRANSFER_AMOUNT, metadata.decimals)} ${metadata.symbol}`
      )
      console.log(
        `     Recipient balance: ${formatUnits(recipientBalance + TRANSFER_AMOUNT, metadata.decimals)} ${metadata.symbol}`
      )
    } else {
      console.log(`   ❌ Insufficient balance for transfer`)
      console.log(`     Required: ${transferFormatted} ${metadata.symbol}`)
      console.log(`     Available: ${yourFormatted} ${metadata.symbol}`)
    }

    console.log('\n   ⚠️  Checking transfer execution...')

    if (yourBalance >= TRANSFER_AMOUNT) {
      try {
        console.log('   💸 Executing transfer...')
        console.log(`   ⚠️  This will transfer real tokens!`)

        const transferTx = await token.transfer(
          TOKEN_ADDRESS as `0x${string}`,
          RECIPIENT_ADDRESS as `0x${string}`,
          TRANSFER_AMOUNT
        )
        console.log(`     ✅ Transfer successful: ${transferTx}`)
        console.log(`     🔗 View on explorer: https://testnet.monadexplorer.com/tx/${transferTx}`)
        console.log(`     📤 Transferred: ${transferFormatted} ${metadata.symbol}`)
      } catch (error: any) {
        console.error(`     ❌ Transfer failed: ${error.message}`)
      }
    } else {
      console.log('   ℹ️  Transfer skipped - insufficient balance')
    }
    console.log('')

    // === Step 6: Advanced Balance Analytics ===
    console.log('📈 Step 6: Advanced Balance Analytics')
    console.log('   Comprehensive balance analysis...\n')

    const addresses = [
      { label: 'Your Wallet', address: token.address },
      { label: 'Recipient', address: RECIPIENT_ADDRESS },
      { label: 'Token Contract', address: TOKEN_ADDRESS },
    ]

    console.log('   🏦 Multi-Address Balance Summary:')
    for (const { label, address } of addresses) {
      try {
        const balance = await token.getBalance(
          TOKEN_ADDRESS as `0x${string}`,
          address as `0x${string}`
        )
        const formatted = formatUnits(balance, metadata.decimals)
        const percent =
          metadata.totalSupply > BigInt(0)
            ? ((Number(balance) / Number(metadata.totalSupply)) * 100).toFixed(4)
            : '0'

        console.log(`     ${label}: ${formatted} ${metadata.symbol} (${percent}%)`)
      } catch {
        console.log(`     ${label}: Error fetching balance`)
      }
    }
    console.log('')

    console.log('✅ Basic operations example completed successfully!')
  } catch (error) {
    console.error('❌ Basic operations example failed:', error)
    throw error
  }
}

// Show workflow summary
function showWorkflowSummary() {
  console.log('\n📚 ERC20 Operations Summary:')
  console.log('')

  console.log('🔍 Query Operations (Read-only):')
  console.log('   ✓ getMetadata() - Name, symbol, decimals, total supply')
  console.log('   ✓ getBalance() - Token balance for any address')
  console.log('   ✓ getBalanceFormatted() - Human-readable balance')
  console.log('   ✓ getAllowance() - Spending permissions')
  console.log('')

  console.log('✍️  Transaction Operations (Requires gas):')
  console.log('   ✓ approve() - Grant spending permission')
  console.log('   ✓ transfer() - Send tokens to another address')
  console.log('   ✓ checkAndApprove() - Smart approval management')
  console.log('')

  console.log('🛡️  Security Best Practices:')
  console.log('   ✓ Always check balances before transfers')
  console.log('   ✓ Use checkAndApprove() for gas optimization')
  console.log('   ✓ Verify token metadata before operations')
  console.log('   ✓ Test with small amounts first')
  console.log('   ✓ Monitor gas costs and network congestion')
}

// Run the example
if (require.main === module) {
  executeBasicOperations()
    .then(() => showWorkflowSummary())
    .then(() => {
      console.log('\n🎉 Example completed!')
      console.log('💡 To execute real transactions:')
      console.log('   1. Review all parameters carefully')
      console.log('   2. Uncomment execution blocks one at a time')
      console.log('   3. Test with small amounts first')
      console.log('   4. Monitor transactions on block explorer')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error)
      process.exit(1)
    })
}

export { executeBasicOperations }
