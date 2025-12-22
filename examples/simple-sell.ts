/**
 * Simple Sell Example
 * Auto approve + slippage calculation
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

  // Sell all (includes automatic approve)
  const tx = await sdk.simpleSell({
    token: tokenAddress,
    amountIn: balance,
    slippagePercent: 1,
  })
  console.log('TX:', tx)

  // Check final balance
  const finalBalance = await sdk.getBalance(tokenAddress)
  console.log('Final Balance:', formatEther(finalBalance))
}

main().catch(console.error)
