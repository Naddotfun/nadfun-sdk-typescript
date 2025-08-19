/**
 * Token Utilities Example
 *
 * Demonstrates comprehensive token management utilities.
 * Perfect for portfolio management, token discovery, and batch operations.
 *
 * Usage:
 * bun run example:token-utils
 * bun run example:token-utils -- --tokens 0xToken1,0xToken2,0xToken3
 */

import { config } from 'dotenv'
import { Token } from '../../src/Token'
import { formatUnits, parseEther, formatEther } from 'viem'
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
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

// Configuration
const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const PRIVATE_KEY =
  args['private-key'] ||
  process.env.PRIVATE_KEY ||
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

// Sample tokens for demonstration (replace with real addresses)
const DEFAULT_TOKENS = [
  '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1', // Sample token 1
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
  '0x1234567890123456789012345678901234567890', // Sample token 3
]

const TOKENS = args.tokens?.split(',').map(t => t.trim()) || DEFAULT_TOKENS

async function executeTokenUtilsExample() {
  console.log('🪙 NADS Fun SDK - Token Utilities Example\n')
  console.log('🚀 Comprehensive token management and batch operations')
  console.log('')

  try {
    // Initialize Token instance
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${token.address}`)
    console.log(`   Tokens: ${TOKENS.length} tokens`)
    TOKENS.forEach((addr, i) => {
      console.log(`     ${i + 1}. ${addr}`)
    })
    console.log('')

    // === 1. Single Token Operations ===
    console.log('🔍 1. Single Token Operations')
    const firstToken = TOKENS[0] as `0x${string}`

    console.log(`   Analyzing token: ${firstToken}`)

    try {
      // Individual metadata calls
      console.log('   📊 Individual metadata calls:')
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.getName(firstToken),
        token.getSymbol(firstToken),
        token.getDecimals(firstToken),
        token.getTotalSupply(firstToken),
      ])

      console.log(`     Name: ${name}`)
      console.log(`     Symbol: ${symbol}`)
      console.log(`     Decimals: ${decimals}`)
      console.log(`     Total Supply: ${formatUnits(totalSupply, decimals)}`)

      // Token capabilities
      console.log('   🔧 Token capabilities:')
      const [isContract, hasPermit] = await Promise.all([
        token.isContract(firstToken),
        token.hasPermit(firstToken),
      ])

      console.log(`     Is Contract: ${isContract ? '✅' : '❌'}`)
      console.log(`     Supports Permit: ${hasPermit ? '✅' : '❌'}`)

      // Balance
      const balance = await token.getBalance(firstToken)
      console.log(`     Your Balance: ${formatUnits(balance, decimals)} ${symbol}`)
    } catch (error: any) {
      console.log(`     ❌ Error analyzing token: ${error.message}`)
    }
    console.log('')

    // === 2. Token Health Check ===
    console.log('🏥 2. Token Health Check')
    console.log('   Comprehensive token validation:')

    const health = await token.getTokenHealth(firstToken)
    console.log(`     Contract Status: ${health.isContract ? '✅ Valid' : '❌ Invalid'}`)
    console.log(`     ERC20 Functions: ${health.hasBasicFunctions ? '✅ Working' : '❌ Missing'}`)
    console.log(`     Permit Support: ${health.hasPermit ? '✅ Yes' : '❌ No'}`)

    if (health.metadata) {
      console.log(`     Token Name: ${health.metadata.name}`)
      console.log(`     Token Symbol: ${health.metadata.symbol}`)
      console.log(`     Decimals: ${health.metadata.decimals}`)
    }

    if (health.hasPermit && health.permitSupport.domainSeparator) {
      console.log(
        `     Domain Separator: ${health.permitSupport.domainSeparator.substring(0, 10)}...`
      )
      console.log(`     Current Nonce: ${health.permitSupport.currentNonce}`)
    }

    if (health.error) {
      console.log(`     Error: ${health.error}`)
    }
    console.log('')

    // === 3. Batch Operations ===
    console.log('⚡ 3. Batch Operations (High Performance)')

    console.log('   🗂️  Batch metadata fetch:')
    const startTime = Date.now()
    const batchMetadata = await token.batchGetMetadata(TOKENS as `0x${string}`[])
    const metadataTime = Date.now() - startTime

    console.log(`     ⏱️  Fetched ${TOKENS.length} token metadata in ${metadataTime}ms`)
    Object.entries(batchMetadata).forEach(([_address, meta], i) => {
      console.log(`     ${i + 1}. ${meta.symbol}: ${meta.name} (${meta.decimals} decimals)`)
    })
    console.log('')

    console.log('   💰 Batch balance fetch:')
    const balanceStart = Date.now()
    const batchBalances = await token.batchGetBalances(TOKENS as `0x${string}`[])
    const balanceTime = Date.now() - balanceStart

    console.log(`     ⏱️  Fetched ${TOKENS.length} token balances in ${balanceTime}ms`)
    Object.entries(batchBalances).forEach(([_address, balance]) => {
      const meta = batchMetadata[_address]
      if (meta && balance > BigInt(0)) {
        const formatted = formatUnits(balance, meta.decimals)
        console.log(`     💎 ${meta.symbol}: ${formatted}`)
      }
    })

    // Show zero balances too
    const zeroBalances = Object.entries(batchBalances).filter(
      ([, balance]) => balance === BigInt(0)
    )
    if (zeroBalances.length > 0) {
      console.log(`     📭 ${zeroBalances.length} tokens with zero balance`)
    }
    console.log('')

    // === 4. Advanced Features  ===
    console.log('🔬 4. Advanced Features ')
    console.log('')

    if (health.hasPermit) {
      console.log('   🎫 Permit Signature Generation:')
      try {
        // Generate a sample permit signature
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
        const value = parseEther('100')
        const spender = '0x1234567890123456789012345678901234567890' as `0x${string}`

        const permitSignature = await token.generatePermitSignature(
          firstToken,
          spender,
          value,
          deadline
        )

        console.log(`     Generated permit signature for ${formatEther(value)} tokens`)
        console.log(`     Nonce used: ${permitSignature.nonce}`)
        console.log(`     Signature v: ${permitSignature.v}`)
        console.log(`     Signature r: ${permitSignature.r.substring(0, 10)}...`)
        console.log(`     Signature s: ${permitSignature.s.substring(0, 10)}...`)
        console.log(`     ⚡ Ready for gasless trading!`)
      } catch (error: any) {
        console.log(`     ❌ Permit generation failed: ${error.message}`)
      }
    } else {
      console.log('   🎫 Permit: Not supported by this token')
    }
    console.log('')

    // === 5. Allowance Management ===
    console.log('🔐 5. Allowance Management')

    // Sample routers to check allowances against
    const sampleRouters = [
      '0x961235a9020B05C44DF1026D956D1F4D78014276', // DEX Router
      '0x4FBDc4C4FBdC4C4FBdC4C4FBdC4C4FBdC4C4FBdC', // Bonding Router
    ] as `0x${string}`[]

    if (sampleRouters.length > 0) {
      console.log(`   Checking allowances for ${firstToken}:`)

      try {
        const allowances = await token.batchGetAllowances(firstToken, sampleRouters)

        sampleRouters.forEach((router, i) => {
          const allowance = allowances[router.toLowerCase()]
          const formatted = allowance > BigInt(0) ? formatUnits(allowance, 18) : '0'
          console.log(`     Router ${i + 1}: ${formatted} allowed`)
        })
      } catch (error: any) {
        console.log(`     ❌ Error checking allowances: ${error.message}`)
      }
    }
    console.log('')

    // === 6. Performance Analysis ===
    console.log('📊 6. Performance Analysis')
    console.log('')
    console.log('   🔄 Individual vs Batch Operations:')

    // Simulate individual calls time
    const estimatedIndividualTime = TOKENS.length * 50 // ~50ms per token
    const actualBatchTime = metadataTime + balanceTime
    const savings = estimatedIndividualTime - actualBatchTime

    console.log(`     Individual calls (estimated): ~${estimatedIndividualTime}ms`)
    console.log(`     Batch calls (actual): ${actualBatchTime}ms`)
    console.log(
      `     Time saved: ~${savings}ms (${((savings / estimatedIndividualTime) * 100).toFixed(1)}%)`
    )
    console.log('')

    // === 7. Advanced Use Cases ===
    console.log('🎯 7. Advanced Use Cases')
    console.log('')

    console.log('   📈 Portfolio Analysis:')
    let tokensWithBalance = 0

    Object.entries(batchBalances).forEach(([_address, balance]) => {
      if (balance > BigInt(0)) {
        tokensWithBalance++
        // In a real app, you'd fetch prices and calculate USD value
      }
    })

    console.log(`     Tokens in portfolio: ${tokensWithBalance}/${TOKENS.length}`)
    console.log(
      `     Portfolio diversity: ${((tokensWithBalance / TOKENS.length) * 100).toFixed(1)}%`
    )
    console.log('')

    console.log('   🔍 Token Discovery:')
    const validTokens = Object.entries(batchMetadata).filter(([, meta]) => meta.name !== 'Unknown')
    console.log(`     Valid ERC20 tokens: ${validTokens.length}/${TOKENS.length}`)

    validTokens.forEach(([_address, meta]) => {
      const hasBalance = batchBalances[_address] > BigInt(0)
      console.log(`     ${meta.symbol}: ${hasBalance ? '💰 Has balance' : '📭 Empty'}`)
    })
    console.log('')

    // === 8. Best Practices ===
    console.log('💡 8. Best Practices for Token Management')
    console.log('')
    console.log('   🚀 Performance Tips:')
    console.log('     - Use batch operations for multiple tokens')
    console.log('     - Cache metadata for frequently accessed tokens')
    console.log('     - Check token health before important operations')
    console.log('     - Use individual functions only when needed')
    console.log('')

    console.log('   🔒 Security Tips:')
    console.log('     - Always verify isContract() before token operations')
    console.log('     - Check hasPermit() before using permit functions')
    console.log('     - Validate token metadata before displaying to users')
    console.log('     - Use getTokenHealth() for comprehensive validation')
    console.log('')

    console.log('   📚 Available Functions:')
    console.log('     Individual: getName(), getSymbol(), getDecimals(), getTotalSupply()')
    console.log('     Batch: batchGetMetadata(), batchGetBalances(), batchGetAllowances()')
    console.log('     Validation: isContract(), hasPermit(), hasBurn(), getTokenHealth()')
    console.log('     Management: approve(), batchApprove(), checkAndApprove()')
    console.log('     🆕 ERC20Permit: generatePermitSignature(), getNonce(), getDomainSeparator()')
    console.log('     🆕 ERC20Burnable: burn(), burnFrom()')
    console.log('')

    console.log('\n✅ Token utilities example completed!')
  } catch (error: any) {
    console.error('❌ Token utilities example failed:', error)
    throw error
  }
}

// Show usage examples
function showUsageExamples() {
  console.log('\n📚 Usage Examples:')
  console.log('')

  console.log('1. 🪙 Analyze specific tokens:')
  console.log('   bun run example:token-utils -- --tokens 0xToken1,0xToken2,0xToken3')
  console.log('')

  console.log('2. 💰 Portfolio tracking:')
  console.log('   const balances = await token.batchGetBalances([token1, token2, token3])')
  console.log('   const metadata = await token.batchGetMetadata([token1, token2, token3])')
  console.log('')

  console.log('3. 🔍 Token validation:')
  console.log('   const health = await token.getTokenHealth(tokenAddress)')
  console.log('   if (health.hasBasicFunctions && health.hasPermit) { /* safe to use */ }')
  console.log('')

  console.log('4. ⚡ Batch approvals:')
  console.log('   const spenders = [router1, router2, router3]')
  console.log('   const amounts = [amount1, amount2, amount3]')
  console.log('   const txHashes = await token.batchApprove(tokenAddress, spenders, amounts)')
  console.log('')

  console.log('5. 🔐 Allowance management:')
  console.log('   const allowances = await token.batchGetAllowances(token, [router1, router2])')
  console.log('   // Check all allowances at once')
  console.log('')

  console.log('6. 🎫 Generate permit signatures :')
  console.log(
    '   const signature = await token.generatePermitSignature(token, spender, value, deadline)'
  )
  console.log('   // Use signature.v, signature.r, signature.s for gasless trades')
  console.log('')

  console.log('7. 🔥 Burn tokens (ERC20Burnable):')
  console.log('   const burnTx = await token.burn(tokenAddress, amount)')
  console.log('   const burnFromTx = await token.burnFrom(tokenAddress, account, amount)')
}

// Run the example
if (require.main === module) {
  executeTokenUtilsExample()
    .then(() => showUsageExamples())
    .then(() => {
      console.log('\n🎉 Token utilities example completed!')
      console.log('   - Complete ERC20 + ERC20Permit + ERC20Burnable support')
      console.log('   - Parallel processing for optimal performance')
      console.log('   - Advanced permit signature generation')
      console.log('   - Batch operations for better performance')
      console.log('   - Comprehensive token validation')
      console.log('   - Portfolio management utilities')
      console.log('   - Advanced allowance management')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Token utilities example failed:', error)
      process.exit(1)
    })
}

export { executeTokenUtilsExample }
