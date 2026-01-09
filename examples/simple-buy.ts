/**
 * Simple Buy Example
 * Auto slippage calculation
 */

import { initSDK, parseEther, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const nadSDK = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', nadSDK.account.address)

  // Buy
  const tx = await nadSDK.simpleBuy({
    token: tokenAddress,
    amountIn: parseEther('0.1'),
    slippagePercent: 1,
  })
  console.log('TX:', tx)

  // Check balance
  const balance = await nadSDK.getBalance(tokenAddress)
  console.log('Balance:', formatEther(balance))
}

main().catch(console.error)
