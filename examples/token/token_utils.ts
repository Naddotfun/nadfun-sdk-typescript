/**
 * Token Utilities Example
 *
 * Usage:
 * bun run example:token-utils
 * bun run example:token-utils -- --tokens 0xToken1,0xToken2,0xToken3
 */

import { config } from 'dotenv'
import { Token } from '../../src/token/token'
import { formatUnits, parseEther } from 'viem'
import { monadTestnet } from 'viem/chains'
import { parseArgs } from 'util'
import { CONTRACTS } from '../../src/constants'

config()

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'private-key': { type: 'string' },
    'rpc-url': { type: 'string' },
    tokens: { type: 'string' },
  },
  allowPositionals: false,
})

const RPC_URL = args['rpc-url'] || process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0]
const PRIVATE_KEY =
  args['private-key'] ||
  process.env.PRIVATE_KEY ||
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

const TOKEN = process.env.TOKEN || '0xce3D002DD6ECc97a628ad04ffA59DA3D91a589B1'
const DEFAULT_TOKENS = [
  TOKEN,
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
]

// Priority: 1. Command line args, 2. Environment TOKENS, 3. Environment TOKEN, 4. Default
const TOKENS =
  args.tokens?.split(',').map(t => t.trim()) ||
  process.env.TOKENS?.split(',').map(t => t.trim()) || [TOKEN] ||
  DEFAULT_TOKENS

async function executeTokenUtilsExample() {
  console.log('🪙 NADS Fun SDK - Token Utils Example\n')

  try {
    const token = new Token(RPC_URL, PRIVATE_KEY)

    console.log('📋 Configuration:')
    console.log(`   Wallet: ${token.address}`)
    console.log(`   Tokens: ${TOKENS.length}`)

    if (process.env.TOKENS) {
      console.log('   Source: Environment variable (TOKENS)')
    } else if (args.tokens) {
      console.log('   Source: Command line args')
    } else {
      console.log('   Source: Default tokens')
    }
    console.log('')

    // Batch operations for all tokens
    console.log('⚡ Batch Operations:')
    const batchMetadata = await token.batchGetMetadata(TOKENS as `0x${string}`[])
    const batchBalances = await token.batchGetBalances(TOKENS as `0x${string}`[])
    console.log('🔍 Token Analysis:')
    Object.entries(batchMetadata).forEach(([address, meta]) => {
      const balance = batchBalances[address]
      const hasBalance = balance > BigInt(0)
      const formattedBalance = formatUnits(balance, meta.decimals)

      console.log(`   ${meta.name} (${meta.symbol})`)
      console.log(`     Decimals: ${meta.decimals}`)
      console.log(`     Balance: ${formattedBalance} ${hasBalance ? '💰' : '📭'}`)
      console.log('')
    })

    // Health check for all tokens
    console.log('🏥 Health Check:')
    for (const tokenAddr of TOKENS) {
      const meta = Object.values(batchMetadata).find(m => m.address === tokenAddr)

      if (!meta) continue

      const health = await token.getTokenHealth(tokenAddr as `0x${string}`)
      console.log(`   ${meta.symbol}:`)
      console.log(`     Contract: ${health.isContract ? '✅' : '❌'}`)
      console.log(`     ERC20: ${health.hasBasicFunctions ? '✅' : '❌'}`)
      console.log(`     Permit: ${health.hasPermit ? '✅' : '❌'}`)
      console.log('')
    }

    // Permit signature for tokens that support it
    console.log('🎫 Permit Support:')
    for (const tokenAddr of TOKENS) {
      const meta = Object.values(batchMetadata).find(m => m.address === tokenAddr)

      if (!meta) continue

      const health = await token.getTokenHealth(tokenAddr as `0x${string}`)
      if (health.hasPermit) {
        console.log(`   ${meta.symbol}:`)
        try {
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
          const value = parseEther('100')
          const spender = CONTRACTS.MONAD_TESTNET.DEX_ROUTER as `0x${string}`

          const permitSignature = await token.generatePermitSignature(
            tokenAddr as `0x${string}`,
            spender,
            value,
            deadline
          )

          console.log(`     ✅ Generated signature (nonce: ${permitSignature.nonce})`)
        } catch (error: any) {
          console.log(`     ❌ Failed: ${error.message}`)
        }
      } else {
        console.log(`   ${meta.symbol}: ❌ Not supported`)
      }
    }
    console.log('')

    // Check allowances for all tokens
    console.log('🔐 Allowance Check:')
    const routers = [
      CONTRACTS.MONAD_TESTNET.DEX_ROUTER,
      CONTRACTS.MONAD_TESTNET.BONDING_CURVE_ROUTER,
    ] as `0x${string}`[]

    console.log('   📊 All token allowances:')
    for (const tokenAddr of TOKENS) {
      const meta = Object.values(batchMetadata).find(m => m.address === tokenAddr)
      if (!meta) continue

      const allowances = await token.batchGetAllowances(tokenAddr as `0x${string}`, routers)

      console.log(`   ${meta.symbol}:`)
      routers.forEach((router, i) => {
        const allowance = allowances[router.toLowerCase()]
        const hasAllowance = allowance > BigInt(0)
        console.log(`     Router ${i + 1}: ${hasAllowance ? '✅' : '❌'}`)
      })
    }
    console.log('')

    // Token approval example for first token only
    console.log('✅ Approval Management:')
    const firstToken = TOKENS[0] as `0x${string}`
    const firstMeta = Object.values(batchMetadata).find(m => m.address === firstToken)

    if (firstMeta) {
      console.log(`   📝 Testing approval for ${firstMeta.symbol}:`)
      try {
        const approveRouter = CONTRACTS.MONAD_TESTNET.DEX_ROUTER as `0x${string}`
        const approveAmount = parseEther('1000')

        const currentAllowance = await token.getAllowance(firstToken, approveRouter)

        if (currentAllowance < approveAmount) {
          console.log('     🔐 Approving tokens...')
          const approveTx = await token.approve(firstToken, approveRouter, approveAmount)
          console.log(`     ✅ Approved: ${approveTx.substring(0, 10)}...`)
        } else {
          console.log('     ✅ Already approved')
        }
      } catch (error: any) {
        console.log(`     ❌ Approval failed: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Token utils failed:', error)
    throw error
  }
}

if (require.main === module) {
  executeTokenUtilsExample()
    .then(() => {
      console.log('\n🎉 Token utils completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed:', error)
      process.exit(1)
    })
}

export { executeTokenUtilsExample }
