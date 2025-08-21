import type { Address, PublicClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { routerAbi } from '@/abis'
import type { GasEstimationParams } from '@/types'

/**
 * Router configuration mapping
 */

/**
 * Estimate gas for any trading operation
 *
 * This is the main entry point for gas estimation. It takes gas estimation parameters
 * and the router information, then calls the appropriate specialized function.
 *
 * @example
 * ```typescript
 * import { estimateGas, GasEstimationParams } from '@nadfun/sdk'
 *
 * const params: GasEstimationParams = {
 *   type: 'Sell',
 *   token,
 *   amountIn: tokenAmount,
 *   amountOutMin: 1n,
 *   to: wallet,
 *   deadline: 9999999999999999n,
 * }
 *
 * const estimatedGas = await estimateGas(publicClient, routerAddress, params)
 * ```
 */
export async function estimateGas(
  publicClient: PublicClient,
  routerAddress: Address,
  params: GasEstimationParams
): Promise<bigint> {
  switch (params.type) {
    case 'Buy':
      return estimateBuyGas(
        publicClient,
        routerAddress,
        params.token,
        params.amountIn,
        params.amountOutMin,
        params.to,
        params.deadline
      )

    case 'Sell':
      return estimateSellGas(
        publicClient,
        routerAddress,
        params.token,
        params.amountIn,
        params.amountOutMin,
        params.to,
        params.deadline
      )

    case 'SellPermit':
      return estimateSellPermitGas(
        publicClient,
        routerAddress,
        params.token,
        params.amountIn,
        params.amountOutMin,
        params.amountAllowance,
        params.to,
        params.deadline,
        params.v,
        params.r,
        params.s
      )
  }
}

/**
 * Estimate gas for buy operation
 */
export async function estimateBuyGas(
  publicClient: PublicClient,
  routerAddress: Address,
  token: Address,
  amountIn: bigint,
  amountOutMin: bigint,
  to: Address,
  deadline: bigint
): Promise<bigint> {
  const contractParams = {
    amountOutMin,
    token,
    to,
    deadline,
  }

  const callData = encodeFunctionData({
    abi: routerAbi,
    functionName: 'buy',
    args: [contractParams],
  })

  try {
    const gas = await publicClient.estimateGas({
      to: routerAddress,
      account: to,
      value: amountIn,
      data: callData,
    })

    return gas
  } catch (error) {
    throw new Error(
      `Gas estimation failed for buy operation: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Estimate gas for sell operation
 */
export async function estimateSellGas(
  publicClient: PublicClient,
  routerAddress: Address,
  token: Address,
  amountIn: bigint,
  amountOutMin: bigint,
  to: Address,
  deadline: bigint
): Promise<bigint> {
  const contractParams = {
    amountIn,
    amountOutMin,
    token,
    to,
    deadline,
  }

  const callData = encodeFunctionData({
    abi: routerAbi,
    functionName: 'sell',
    args: [contractParams],
  })

  try {
    const gas = await publicClient.estimateGas({
      to: routerAddress,
      account: to,
      data: callData,
    })

    return gas
  } catch (error) {
    throw new Error(
      `Gas estimation failed for sell operation: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Estimate gas for sell permit operation
 */
export async function estimateSellPermitGas(
  publicClient: PublicClient,
  routerAddress: Address,
  token: Address,
  amountIn: bigint,
  amountOutMin: bigint,
  amountAllowance: bigint,
  to: Address,
  deadline: bigint,
  v: number,
  r: `0x${string}`,
  s: `0x${string}`
): Promise<bigint> {
  const contractParams = {
    amountIn,
    amountOutMin,
    amountAllowance,
    token,
    to,
    deadline,
    v,
    r,
    s,
  }

  const callData = encodeFunctionData({
    abi: routerAbi,
    functionName: 'sellPermit',
    args: [contractParams],
  })

  try {
    const gas = await publicClient.estimateGas({
      to: routerAddress,
      account: to,
      data: callData,
    })

    return gas
  } catch (error) {
    throw new Error(
      `Gas estimation failed for sell permit operation: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
