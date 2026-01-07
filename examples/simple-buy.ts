/**
 * Simple Buy Example
 * Auto slippage calculation
 */

import { initSDK, parseEther, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const sdk = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', sdk.account.address)

  // Buy
  const tx = await sdk.simpleBuy({
    token: tokenAddress,
    amountIn: parseEther('0.1'),
    slippagePercent: 1,
  })
  console.log('TX:', tx)

  // Check balance
  const balance = await sdk.getBalance(tokenAddress)
  console.log('Balance:', formatEther(balance))
}

main().catch(console.error)
