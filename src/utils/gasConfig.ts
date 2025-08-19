/**
 * Forge Test Gas Report
 * =====================
 *
 * | Operation        | Mean Gas | Max Gas  | Buffer (20%) | Final Limit |
 * |------------------|----------|----------|--------------|-------------|
 * | BONDING BUY      | 225,873  | 263,913  | +56K         | 320,000     |
 * | BONDING SELL     | 64,628   | 140,042  | +30K         | 170,000     |
 * | BONDING PERMIT   | 116,058  | 174,789  | +35K         | 210,000     |
 * | DEX BUY          | N/A      | N/A      | Estimated    | 350,000     |
 * | DEX SELL         | N/A      | N/A      | Estimated    | 200,000     |
 * | DEX PERMIT       | N/A      | N/A      | Estimated    | 250,000     |
 *
 * Default gas limits for trading operations based on forge test gas reports
 * These values are based on actual gas usage from contract tests and include
 * a reasonable buffer for network variations. Users can override these values
 * or add their own buffer as needed.
 */

export const BONDING_ROUTER_GAS_CONFIG = {
  /// Gas limit for buy operations
  /// Based on forge test: mean 225,873, max 263,913
  /// Using max + 20% buffer = ~316,000

  BUY: 320_000n,
  /// Gas limit for sell operations
  /// Based on forge test: mean 64,628, max 140,042
  /// Using max + 20% buffer = ~168,000
  SELL: 170_000n,

  /// Gas limit for sell permit operations
  /// Based on forge test: mean 116,058, max 174,789
  /// Using max + 20% buffer = ~210,000
  SELL_PERMIT: 210_000n,
}

export const DEX_ROUTER_GAS_CONFIG = {
  /// Gas limit for buy operations
  /// Estimated higher than bonding curve due to DEX complexity
  BUY: 350_000n,

  /// Gas limit for sell operations
  /// Estimated higher than bonding curve due to DEX complexity
  SELL: 200_000n,

  /// Gas limit for sell permit operations
  /// Estimated higher than bonding curve due to DEX complexity
  SELL_PERMIT: 250_000n,
}
