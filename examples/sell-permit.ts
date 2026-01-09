/**
 * Sell with Permit Example
 * Uses EIP-2612 permit signature instead of approve transaction
 */

import { initSDK, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const nadSDK = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', nadSDK.account.address)

  // Check balance
  const balance = await nadSDK.getBalance(tokenAddress)
  console.log('Balance:', formatEther(balance))

  if (balance === 0n) {
    console.log('No tokens to sell')
    return
  }

  const amountIn = balance

  // Get quote
  const { router, amount } = await nadSDK.getAmountOut(tokenAddress, amountIn, false)
  console.log(`Quote: ${formatEther(amountIn)} tokens -> ${formatEther(amount)} MON`)
  console.log('Router:', router)

  // Calculate slippage (1%)
  const amountOutMin = (amount * 99n) / 100n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300)

  // Generate permit signature
  const permit = await nadSDK.generatePermitSignature(tokenAddress, router, amountIn, deadline)
  console.log('Permit signature generated')

  // Sell with permit
  const tx = await nadSDK.sellPermit(
    {
      token: tokenAddress,
      amountIn,
      amountOutMin,
      amountAllowance: amountIn,
      to: nadSDK.account.address,
      deadline,
      v: permit.v,
      r: permit.r,
      s: permit.s,
    },
    router
  )
  console.log('TX:', tx)

  // Check final balance
  const finalBalance = await nadSDK.getBalance(tokenAddress)
  console.log('Final Balance:', formatEther(finalBalance))
}

main().catch(console.error)
