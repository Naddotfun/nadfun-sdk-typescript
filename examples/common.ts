/**
 * Common utilities for examples
 */

export type Network = 'testnet' | 'mainnet'

export const network: Network =
  (process.argv[2] as Network) ||
  (process.env.NETWORK as Network) ||
  'testnet'

export const rpcUrl =
  network === 'mainnet'
    ? process.env.MAINNET_RPC_URL!
    : process.env.TESTNET_RPC_URL!

export const wsUrl =
  network === 'mainnet'
    ? process.env.MAINNET_WS_URL!
    : process.env.TESTNET_WS_URL!

export const privateKey = process.env.PRIVATE_KEY! as `0x${string}`
export const tokenAddress = process.env.TOKEN_ADDRESS! as `0x${string}`
