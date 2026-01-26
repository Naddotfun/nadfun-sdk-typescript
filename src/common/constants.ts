import { monadTestnet } from 'viem/chains'
import type { Chain, Address } from 'viem'

// ==================== Network ====================

export type Network = 'testnet' | 'mainnet'

export interface NetworkContracts {
  DEX_ROUTER: Address
  BONDING_CURVE_ROUTER: Address
  LENS: Address
  CURVE: Address
  WMON: Address
  V3_FACTORY: Address
}

// ==================== API ====================

export const API_BASE_URL: Record<Network, string> = {
  testnet: 'https://dev-api.nad.fun',
  mainnet: 'https://api.nadapp.net',
}

// ==================== Contracts ====================

export const CONTRACTS: Record<Network, NetworkContracts> = {
  testnet: {
    DEX_ROUTER: '0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2',
    BONDING_CURVE_ROUTER: '0x865054F0F6A288adaAc30261731361EA7E908003',
    LENS: '0xB056d79CA5257589692699a46623F901a3BB76f1',
    CURVE: '0x1228b0dc9481C11D3071E7A924B794CfB038994e',
    WMON: '0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd',
    V3_FACTORY: '0xd0a37cf728CE2902eB8d4F6f2afc76854048253b',
  },
  mainnet: {
    DEX_ROUTER: '0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137',
    BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
    LENS: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea',
    CURVE: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
    WMON: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    V3_FACTORY: '0x6B5F564339DbAD6b780249827f2198a841FEB7F3',
  },
} as const

// ==================== Chains ====================

const monadMainnet: Chain = {
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.monad.xyz/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://monadvision.com/',
    },
  },
}

export const CHAINS: Record<Network, Chain> = {
  testnet: monadTestnet,
  mainnet: monadMainnet,
}

// ==================== Defaults ====================

export const DEFAULT_NETWORK: Network = 'testnet'
export const DEFAULT_DEADLINE_SECONDS = 300

// NADS standard fee tier for Uniswap V3 pools
export const NADS_FEE_TIER = 10000 // 1%
