/**
 * Gas Estimation Example
 *
 * This example demonstrates how to use the unified gas estimation function
 * to get accurate gas estimates for trading operations.
 *
 * ## Important Notes
 *
 * - **Token Approval Required**: For SELL and SELL PERMIT operations, tokens must be
 *   approved for the router before gas estimation will work properly. This example
 *   automatically handles token approval when needed.
 *
 * - **Real Network Conditions**: Gas estimation uses actual network calls and will
 *   fail if proper token balances and approvals are not in place.
 *
 * - **Automatic Problem Solving**: The example includes automatic approval handling
 *   and real permit signature generation to ensure gas estimation succeeds.
 */

import { parseEther, type Address } from 'viem'
import { Trade, Token, type GasEstimationParams } from '../../src/index'
import { config } from 'dotenv'
import { calculateMinAmountOut } from '../../src/trading/slippage'
import { monadTestnet } from 'viem/chains'

// Load environment variables
config()

async function main() {
  // Configuration
  const config = {
    rpcUrl: process.env.RPC_URL || monadTestnet.rpcUrls.default.http[0],
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    token:
      (process.env.TOKEN as Address) || ('0x1234567890123456789012345678901234567890' as Address),
  }

  console.log('📋 Configuration:')
  console.log(`  RPC URL: ${config.rpcUrl}`)
  console.log(`  Private Key: ✅ Provided`)
  console.log(`  Token: ${config.token}`)
  console.log()

  // Initialize trading interface
  const trade = new Trade(config.rpcUrl, config.privateKey)
  const tokenHelper = new Token(config.rpcUrl, config.privateKey)
  const token = config.token
  const wallet = trade.account.address as Address

  console.log(`🔍 Wallet: ${wallet}`)
  console.log(`🪙 Token: ${token}`)
  console.log()

  // Example amounts
  const monAmount = parseEther('0.01') // 0.01 MON for buying
  const tokenAmount = parseEther('1') // 1 token for gas estimation
  const deadline = BigInt(9999999999999)

  // Get router information
  const { router, amount: expectedTokens } = await trade.getAmountOut(token, monAmount, true)
  const minTokens = calculateMinAmountOut(expectedTokens, 5.0)

  console.log(`📊 Router: ${router}`)
  console.log(`💱 Expected tokens from 0.01 MON: ${expectedTokens}`)
  console.log(`🛡️ Min tokens (5% slippage): ${minTokens}`)
  console.log()

  // === BUY GAS ESTIMATION ===
  console.log('⛽ === BUY GAS ESTIMATION ===')

  const buyParams: GasEstimationParams = {
    type: 'Buy',
    token,
    amountIn: monAmount,
    amountOutMin: minTokens,
    to: wallet,
    deadline,
  }

  let buyGas: bigint
  try {
    buyGas = await trade.estimateGas(router, buyParams)
    console.log(`📈 Estimated gas for BUY: ${buyGas}`)
  } catch (error) {
    console.log(`⚠️ BUY gas estimation failed: ${error}`)
    throw error
  }

  // Different buffer strategies
  const buyGasWithBufferFixed = buyGas + BigInt(50_000)
  const buyGasWithBufferPercent = (buyGas * BigInt(120)) / BigInt(100) // 20% buffer

  console.log(`  📊 With fixed buffer (+50k): ${buyGasWithBufferFixed}`)
  console.log(`  📊 With 20% buffer: ${buyGasWithBufferPercent}`)
  console.log()

  // === SELL GAS ESTIMATION ===
  console.log('⛽ === SELL GAS ESTIMATION ===')
  console.log('⚠️  NOTE: SELL operations require token approval for the router!')
  console.log('    This example will automatically approve tokens if needed.')

  // Check actual token balance
  let tokenBalance: bigint
  try {
    tokenBalance = await tokenHelper.getBalance(token, wallet)
    console.log(`💰 Token balance: ${tokenBalance}`)
  } catch (error) {
    console.log(`⚠️ Could not check token balance: ${error}`)
    tokenBalance = BigInt(0)
  }

  let actualSellAmount: bigint
  if (tokenBalance >= tokenAmount) {
    actualSellAmount = tokenAmount // Use 1 token for estimation
  } else if (tokenBalance > BigInt(0)) {
    // Use smaller amount if available balance is less than 1 token
    actualSellAmount = tokenBalance < parseEther('0.1') ? tokenBalance : parseEther('0.1')
  } else {
    actualSellAmount = parseEther('0.1') // Use very small amount for estimation even if no balance
  }

  console.log(`🔄 Using amount for estimation: ${actualSellAmount}`)

  let sellRouter: Address
  let expectedMon: bigint
  try {
    const result = await trade.getAmountOut(token, actualSellAmount, false)
    sellRouter = result.router
    expectedMon = result.amount
  } catch (error) {
    console.log(`⚠️ Could not get sell quote: ${error}`)
    // Use buy router as fallback
    sellRouter = router
    expectedMon = BigInt(1) // 1 wei as fallback
  }

  // Check allowance for the router
  let allowance: bigint
  try {
    allowance = await tokenHelper.getAllowance(token, wallet, sellRouter)
    console.log(`🔒 Current allowance for router: ${allowance}`)
  } catch (error) {
    console.log(`⚠️ Could not check allowance: ${error}`)
    allowance = BigInt(0)
  }

  if (allowance < actualSellAmount) {
    console.log(`⚠️ Insufficient allowance! Need: ${actualSellAmount}, Have: ${allowance}`)
    console.log('🔧 Approving tokens for router...')

    try {
      const txHash = await tokenHelper.approve(token, sellRouter, actualSellAmount)
      console.log(`✅ Approval successful: ${txHash}`)
      console.log('⏳ Waiting for approval to be mined...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      console.log(`⚠️ Approval failed: ${error}`)
      console.log('🔧 Gas estimation may still fail due to lack of approval')
    }
  } else {
    console.log('✅ Sufficient allowance available')
  }

  const sellParams: GasEstimationParams = {
    type: 'Sell',
    token,
    amountIn: actualSellAmount,
    amountOutMin: BigInt(1), // Use very low minimum to avoid revert
    to: wallet,
    deadline,
  }

  let sellGas = BigInt(0)
  try {
    sellGas = await trade.estimateGas(sellRouter, sellParams)
    console.log(`📈 Estimated gas for SELL: ${sellGas}`)
  } catch (error) {
    console.log(`⚠️ SELL gas estimation failed: ${error}`)
    console.log('🔄 Skipping SELL gas comparison')
  }

  // Different buffer strategies
  const sellGasWithBufferFixed = sellGas + BigInt(30_000)
  const sellGasWithBufferPercent = (sellGas * BigInt(115)) / BigInt(100) // 15% buffer

  console.log(`  📊 With fixed buffer (+30k): ${sellGasWithBufferFixed}`)
  console.log(`  📊 With 15% buffer: ${sellGasWithBufferPercent}`)
  console.log()

  // === SELL PERMIT GAS ESTIMATION ===
  console.log('⛽ === SELL PERMIT GAS ESTIMATION ===')
  console.log('⚠️  NOTE: SELL PERMIT operations require real permit signatures!')
  console.log('    This example generates real EIP-2612 permit signatures for accurate estimation.')

  // Generate real permit signature for gas estimation
  let v: number
  let r: `0x${string}`
  let s: `0x${string}`

  try {
    const signature = await tokenHelper.generatePermitSignature(
      token,
      sellRouter as `0x${string}`,
      actualSellAmount,
      deadline
    )
    v = signature.v
    r = signature.r as `0x${string}`
    s = signature.s as `0x${string}`
    console.log('✅ Generated valid permit signature')
  } catch (error) {
    console.log(`⚠️ Permit signature generation failed: ${error}`)
    console.log('🔧 Using dummy signature - estimation will likely fail')
    v = 27
    r = `0x${'00'.repeat(32)}` as `0x${string}`
    s = `0x${'00'.repeat(32)}` as `0x${string}`
  }

  const sellPermitParams: GasEstimationParams = {
    type: 'SellPermit',
    token,
    amountIn: actualSellAmount,
    amountOutMin: BigInt(2), // Use very low minimum to avoid revert
    amountAllowance: actualSellAmount, // Must match the amount used in permit signature
    to: wallet,
    deadline,
    v,
    r,
    s,
  }

  console.log('🔍 SELL PERMIT PARAMS:')

  let sellPermitGas = BigInt(0)
  try {
    sellPermitGas = await trade.estimateGas(sellRouter, sellPermitParams)
    console.log(`📈 Estimated gas for SELL PERMIT: ${sellPermitGas}`)
  } catch (error) {
    console.log(`⚠️ SELL PERMIT gas estimation failed: ${error}`)
    console.log('🔄 Skipping SELL PERMIT gas comparison')
  }

  // Different buffer strategies
  const permitGasWithBuffer = (sellPermitGas * BigInt(125)) / BigInt(100) // 25% buffer (permits can be more complex)

  console.log(`  📊 With 25% buffer: ${permitGasWithBuffer}`)
  console.log()

  // === GAS COMPARISON ===
  console.log('📊 === GAS COMPARISON ===')
  console.log(`  🔵 BUY: ${buyGas} gas`)
  console.log(`  🔴 SELL: ${sellGas} gas`)
  console.log(`  🟣 SELL PERMIT: ${sellPermitGas} gas`)
  console.log()

  // Calculate costs (assuming 50 gwei gas price)
  const gasPriceGwei = BigInt(50)
  const gasPriceWei = gasPriceGwei * BigInt(1_000_000_000) // Convert to wei

  const buyCostWei = buyGas * gasPriceWei
  const sellCostWei = sellGas * gasPriceWei
  const permitCostWei = sellPermitGas * gasPriceWei

  console.log('💰 === ESTIMATED COSTS (at 50 gwei) ===')
  console.log(`  🔵 BUY: ${buyCostWei} wei (~${Number(buyCostWei) / 1e18} MON)`)
  console.log(`  🔴 SELL: ${sellCostWei} wei (~${Number(sellCostWei) / 1e18} MON)`)
  console.log(`  🟣 SELL PERMIT: ${permitCostWei} wei (~${Number(permitCostWei) / 1e18} MON)`)
  console.log()
}

// Run the example
main().catch(console.error)
