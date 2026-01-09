/**
 * Low-level Sell Example
 * Manual control over router, approve, and parameters
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

  // Approve
  console.log('Approving...')
  await nadSDK.approve(tokenAddress, router, amountIn)

  // Sell
  const tx = await nadSDK.sell(
    {
      token: tokenAddress,
      amountIn,
      amountOutMin,
      to: nadSDK.account.address,
      deadline,
    },
    router
  )
  console.log('TX:', tx)

  // Check final balance
  const finalBalance = await nadSDK.getBalance(tokenAddress)
  console.log('Final Balance:', formatEther(finalBalance))
}

main().catch(console.error)
