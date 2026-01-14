/**
 * Create Token Example
 * Full flow: image upload -> metadata upload -> salt mining -> contract call
 *
 * Usage:
 *   npm run example:create-token
 *
 * Edit the CONFIG below to customize token creation.
 */

import * as fs from 'fs'
import * as path from 'path'
import { initSDK, parseEther, formatEther } from '../src'
import { network, rpcUrl, privateKey } from './common'

// ===== Configuration (Edit these values) =====
const CONFIG = {
  image: './examples/sample-image.png',
  name: 'My Test Token',
  symbol: 'MTT',
  description: 'A test token created with NadFun SDK',
  website: 'https://mytoken.com',
  twitter: 'https://x.com/mytoken',
  telegram: 'https://t.me/mytoken',
  initialBuyMon: '0.1', // Initial buy amount in MON (set to '0' for no initial buy)
}

async function main() {
  const { image: imagePath, name: tokenName, symbol: tokenSymbol, description: tokenDesc } = CONFIG
  const { website: tokenWebsite, twitter: tokenTwitter, telegram: tokenTelegram } = CONFIG
  const { initialBuyMon } = CONFIG

  const nadSDK = initSDK({ rpcUrl, privateKey, network })

  console.log('Network:', network)
  console.log('Creator:', nadSDK.account.address)

  // Load image file
  if (!fs.existsSync(imagePath)) {
    console.error(`Image file not found: ${imagePath}`)
    process.exit(1)
  }

  const imageBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).toLowerCase()
  const contentTypeMap: Record<
    string,
    'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml'
  > = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  const contentType = contentTypeMap[ext]
  if (!contentType) {
    console.error(`Unsupported image format: ${ext}`)
    process.exit(1)
  }

  // Get deploy fee
  const feeConfig = await nadSDK.getFeeConfig()
  console.log('Deploy fee:', formatEther(feeConfig.deployFeeAmount), 'MON')

  // Initial buy amount
  const initialBuyAmount = parseEther(initialBuyMon)
  if (initialBuyAmount > 0n) {
    const expectedTokens = await nadSDK.getInitialBuyAmountOut(initialBuyAmount)
    console.log('Initial buy:', formatEther(initialBuyAmount), 'MON')
    console.log('Expected tokens:', formatEther(expectedTokens))
  }

  // Create token
  console.log('\nCreating token...')
  const result = await nadSDK.createToken({
    name: tokenName,
    symbol: tokenSymbol,
    description: tokenDesc,
    image: imageBuffer,
    imageContentType: contentType,
    website: tokenWebsite,
    twitter: tokenTwitter,
    telegram: tokenTelegram,
    initialBuyAmount,
  })

  console.log('\n=== Token Created ===')
  console.log('Token Address:', result.tokenAddress)
  console.log('Pool Address:', result.poolAddress)
  console.log('TX Hash:', result.transactionHash)
  console.log('Image URI:', result.imageUri)
  console.log('Metadata URI:', result.metadataUri)
  console.log('Salt:', result.salt)
  console.log('Is NSFW:', result.isNsfw)
}

main().catch(console.error)
