/**
 * Low-level Buy Example
 * Manual control over router and parameters
 */

import { initSDK, parseEther, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', sdk.account.address)

  const amountIn = parseEther('0.1')

  // Get quote
  const { router, amount } = await sdk.getAmountOut(tokenAddress, amountIn, true)
  console.log(`Quote: ${formatEther(amountIn)} MON -> ${formatEther(amount)} tokens`)
  console.log('Router:', router)

  // Calculate slippage (1%)
  const amountOutMin = (amount * 99n) / 100n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300)

  // Buy
  const tx = await sdk.buy(
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

  // Check balance
  const balance = await sdk.getBalance(tokenAddress)
  console.log('Balance:', formatEther(balance))
}

main().catch(console.error)
