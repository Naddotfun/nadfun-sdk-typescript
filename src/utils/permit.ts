import { Hex, PublicClient, WalletClient } from 'viem'

interface PermitSignatureParams {
  walletClient: WalletClient
  publicClient: PublicClient
  owner: string
  spender: string
  value: bigint
  nonce: bigint
  deadline: bigint
  chainId: number
  token: `0x${string}`
  account: `0x${string}`
}

export async function getPermitSignature({
  owner,
  spender,
  value,
  nonce,
  deadline,
  chainId,
  token,
  walletClient,
  publicClient,
  account: _account,
}: PermitSignatureParams) {
  try {
    // Get token name from contract for EIP-712 domain
    let tokenName = ''
    try {
      tokenName = (await publicClient.readContract({
        address: token,
        abi: [
          {
            type: 'function',
            name: 'name',
            inputs: [],
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
          },
        ],
        functionName: 'name',
      })) as string
    } catch {
      // Fallback to empty string if name() is not available
      tokenName = ''
    }

    const domain = {
      name: tokenName,
      version: '1',
      chainId,
      verifyingContract: token,
    }

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    }

    const message = {
      owner,
      spender,
      value,
      nonce,
      deadline,
    }

    const signature = await walletClient.signTypedData({
      domain,
      types,
      primaryType: 'Permit',
      message,
    } as any)

    // Parse signature
    const sig = signature.slice(2)
    const r = `0x${sig.substring(0, 64)}` as Hex
    const s = `0x${sig.substring(64, 128)}` as Hex
    const v = parseInt(sig.substring(128, 130), 16)

    return { v, r, s }
  } catch (error: any) {
    // Para wallet specific error messages
    if (error?.message?.includes('signTypedData')) {
      throw new Error('Wallet does not support permit signing. Please use regular approval method.')
    }

    if (error?.message?.includes('User rejected')) {
      throw new Error('User cancelled the signature.')
    }

    // Re-throw original error
    throw error
  }
}
