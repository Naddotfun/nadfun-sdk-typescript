/**
 * Token Operations Example
 * Balance, metadata, approve, transfer
 */

import { initSDK, formatEther } from '../src'
import { network, rpcUrl, privateKey, tokenAddress } from './common'

async function main() {
  const nadSDK = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Wallet:', nadSDK.account.address)

  // ==================== Metadata ====================
  console.log('\n--- Token Metadata ---')
  const metadata = await nadSDK.getMetadata(tokenAddress)
  console.log('Name:', metadata.name)
  console.log('Symbol:', metadata.symbol)
  console.log('Decimals:', metadata.decimals)
  console.log('Total Supply:', formatEther(metadata.totalSupply))

  // ==================== Balance ====================
  console.log('\n--- Balance ---')
  const [raw, formatted] = await nadSDK.getBalanceFormatted(tokenAddress)
  console.log('Raw:', raw.toString())
  console.log('Formatted:', formatted, metadata.symbol)

  // ==================== Curve State ====================
  console.log('\n--- Curve State ---')
  const isGraduated = await nadSDK.isGraduated(tokenAddress)
  console.log('Graduated:', isGraduated)

  if (!isGraduated) {
    const state = await nadSDK.getCurveState(tokenAddress)
    console.log('Real MON Reserve:', formatEther(state.realMonReserve))
    console.log('Real Token Reserve:', formatEther(state.realTokenReserve))

    const progress = await nadSDK.getProgress(tokenAddress)
    console.log('Progress:', `${Number(progress) / 100}%`)
  }

  // ==================== Allowance ====================
  console.log('\n--- Allowance ---')
  const spender = '0x0000000000000000000000000000000000000001' as `0x${string}`
  const allowance = await nadSDK.getAllowance(tokenAddress, spender)
  console.log('Current allowance:', formatEther(allowance))
}

main().catch(console.error)
