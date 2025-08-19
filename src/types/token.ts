import { Address } from 'viem'

/**
 * Token-related Types
 * Used by: src/Token.ts, examples/token/*.ts
 */

/**
 * ERC-20 token metadata information
 * Used by: Token.getMetadata(), Token.batchGetMetadata(), examples/token/token_utils.ts
 */
export interface TokenMetadata {
  /** Token name (from name() function) */
  name: string
  /** Token symbol (from symbol() function) */
  symbol: string
  /** Token decimals (from decimals() function) */
  decimals: number
  /** Total supply (from totalSupply() function) */
  totalSupply: bigint
  /** Token contract address */
  address: Address
}

/**
 * Comprehensive token health and validation information
 * Used by: Token.getTokenHealth()
 */
export interface TokenHealth {
  /** Whether the address is a valid contract */
  isContract: boolean
  /** Whether basic ERC-20 functions are available */
  hasBasicFunctions: boolean
  /** Whether the token supports EIP-2612 permit */
  hasPermit: boolean
  /** Token metadata (null if unavailable) */
  metadata: TokenMetadata | null
  /** EIP-2612 permit specific information */
  permitSupport: {
    /** EIP-712 domain separator */
    domainSeparator?: string
    /** Current nonce for the owner */
    currentNonce?: bigint
  }
  /** Error message if validation failed */
  error?: string
}

/**
 * EIP-2612 permit signature components
 * Used by: Token.generatePermitSignature(), utils/permit.ts
 */
export interface PermitSignature {
  /** Recovery parameter */
  v: number
  /** ECDSA signature r component */
  r: string
  /** ECDSA signature s component */
  s: string
  /** Nonce used for the permit */
  nonce: bigint
}
