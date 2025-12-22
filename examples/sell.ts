/**
 * Low-level Sell Example
 * Manual control over router, approve, and parameters
 */

import { initSDK, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', sdk.account.address)

  // Check balance
  const balance = await sdk.getBalance(tokenAddress)
  console.log('Balance:', formatEther(balance))

  if (balance === 0n) {
    console.log('No tokens to sell')
    return
  }

  const amountIn = balance

  // Get quote
  const { router, amount } = await sdk.getAmountOut(tokenAddress, amountIn, false)
  console.log(`Quote: ${formatEther(amountIn)} tokens -> ${formatEther(amount)} MON`)
  console.log('Router:', router)

  // Calculate slippage (1%)
  const amountOutMin = (amount * 99n) / 100n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300)

  // Approve
  console.log('Approving...')
  await sdk.approve(tokenAddress, router, amountIn)

  // Sell
  const tx = await sdk.sell(
    {
      token: tokenAddress,
      amountIn,
      amountOutMin,
      to: sdk.account.address,
      deadline,
    },
    router
  )
  console.log('TX:', tx)

  // Check final balance
  const finalBalance = await sdk.getBalance(tokenAddress)
  console.log('Final Balance:', formatEther(finalBalance))
}

main().catch(console.error)
