/**
 * EIP-2612 permit signature generation example
 *
 * This example demonstrates:
 * 1. Getting token permit-related data (nonce)
 * 2. Generating EIP-2612 permit signatures
 * 3. Understanding permit signature components
 * 4. Permit signature verification concepts
 * 5. Security considerations
 *
 * Usage:
 * # Using environment variables
 * export PRIVATE_KEY="your_private_key_here"
 * export RPC_URL="https://your-rpc-url"
 * export TOKEN="0xTokenAddress"
 * bun run example:permit-signature
 *
 * # Using command line arguments
 * bun run example:permit-signature -- --private-key your_private_key_here --rpc-url https://your-rpc-url --token 0xTokenAddress
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
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || 'https://testnet-rpc.monad.xyz'
const PRIVATE_KEY = args['private-key'] || process.env.PRIVATE_KEY
const TOKEN = args.token || process.env.TOKEN

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
  console.log('')

  try {
    // Spender address (e.g., a DEX router or smart contract)
    const spender = '0x9876543210987654321098765432109876543210' as `0x${string}`

    // Amount to approve via permit
    const approveAmount = parseEther('1000')

    // Create Token instance
    const tokenHelper = new Token(RPC_URL, PRIVATE_KEY)
    const wallet = tokenHelper.address

    console.log('✍️  EIP-2612 Permit Signature Demo')
    console.log(`Wallet: ${wallet}`)
    console.log(`Token: ${TOKEN}`)
    console.log(`Spender: ${spender}`)
    console.log(`Amount: ${approveAmount}`)
    console.log('')

    // 1. Get token metadata for context
    console.log('📋 Getting token information...')
    const metadata = await tokenHelper.getMetadata(TOKEN as `0x${string}`)
    console.log(`  Token: ${metadata.name} (${metadata.symbol})`)
    console.log(`  Decimals: ${metadata.decimals}`)
    console.log('')

    //2 Get current nonce for the wallet
    console.log('🔍 Checking permit support...')
    let currentNonce = 0n

    try {
      // Get current nonce for the wallet
      currentNonce = await tokenHelper.getNonce(TOKEN as `0x${string}`, wallet as `0x${string}`)
      console.log('  ✅ Token supports EIP-2612 permit')
      console.log(`  Current nonce: ${currentNonce}`)
    } catch (error) {
      console.log(error)
      console.log('  ❌ Token does not support EIP-2612 permit')
      console.log('  ⚠️  Cannot continue with permit signature generation')
      process.exit(1)
    }
    console.log('')

    // 3. Set deadline (1 hour from now)
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + 3600
    const deadline = BigInt(deadlineTimestamp)

    console.log('⏰ Setting permit deadline...')
    console.log(`  Deadline timestamp: ${deadlineTimestamp}`)
    console.log(`  Deadline: ${deadline}`)
    console.log(`  Valid for: 1 hour from now`)
    console.log('')

    // 4. Generate permit signature
    console.log('🔐 Generating permit signature...')
    console.log('  This creates a cryptographic signature allowing gasless approvals')

    const signature = await tokenHelper.generatePermitSignature(
      TOKEN as `0x${string}`,
      spender,
      approveAmount,
      deadline
    )

    console.log('  ✅ Permit signature generated!')
    console.log(`  v: ${signature.v}`)
    console.log(`  r: ${signature.r}`)
    console.log(`  s: ${signature.s}`)
    console.log('')

    // 5. Explain the signature components
    console.log('📚 Understanding the signature:')
    console.log('  v: Recovery parameter (27 or 28)')
    console.log('  r: First 32 bytes of signature')
    console.log('  s: Second 32 bytes of signature')
    console.log('')

    console.log('💡 How to use this signature:')
    console.log('  1. Include v, r, s in your permit transaction')
    console.log('  2. Call permit() on the token contract')
    console.log('  3. Or use it with functions like sellPermit() for gasless trading')
    console.log('')

    // 6. Show what the permit would do
    console.log('📋 This permit signature authorizes:')
    console.log(`  Owner: ${wallet}`)
    console.log(`  Spender: ${spender}`)
    console.log(`  Amount: ${formatUnits(approveAmount, metadata.decimals)} ${metadata.symbol}`)
    console.log(`  Deadline: ${deadline} (timestamp)`)
    console.log(`  Nonce: ${currentNonce}`)
    console.log('')

    // 7. Security considerations
    console.log('🛡️  Security considerations:')
    console.log('  ⚠️  Never share your private key')
    console.log('  ⚠️  Verify spender address before signing')
    console.log('  ⚠️  Check amount and deadline carefully')
    console.log('  ⚠️  Each signature can only be used once (nonce-based)')
    console.log('  ⚠️  Signatures expire after deadline')
    console.log('')

    // 8. Example usage in code
    console.log('📝 Example usage in code:')
    console.log('```typescript')
    console.log('// Use with Trade.sellPermit()')
    console.log('const result = await trade.sellPermit({')
    console.log('  token,')
    console.log('  amountIn: approveAmount,')
    console.log('  amountOutMin,')
    console.log('  to: wallet,')
    console.log('  deadline,')
    console.log('  v: signature.v,')
    console.log('  r: signature.r,')
    console.log('  s: signature.s,')
    console.log('  gasLimit,')
    console.log('}, router)')
    console.log('```')
    console.log('')

    // 9. Next steps
    console.log('🚀 Next steps:')
    console.log('  1. Use this signature with a permit-supporting function')
    console.log('  2. Or call token.permit(owner, spender, amount, deadline, v, r, s)')
    console.log('  3. The approval will be set without requiring a separate transaction')
    console.log('')

    // 10. Additional information
    console.log('ℹ️  Additional Information:')
    console.log('  - Permit signatures enable gasless token approvals')
    console.log('  - Not all tokens support EIP-2612 permit')
    console.log('  - The signature is specific to the chain ID')
    console.log('  - Each nonce can only be used once per owner')
    console.log('')

    console.log('✅ Permit signature demo completed!')
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

export { main as executePermitSignatureExample }
