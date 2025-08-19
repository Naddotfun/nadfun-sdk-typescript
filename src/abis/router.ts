export const routerAbi = [
  {
    type: 'function',
    name: 'buy',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct BuyParams',
        components: [
          {
            name: 'amountOutMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'token', type: 'address', internalType: 'address' },
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'sell',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct SellParams',
        components: [
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          {
            name: 'amountOutMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'token', type: 'address', internalType: 'address' },
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sellPermit',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct SellPermitParams',
        components: [
          {
            name: 'amountIn',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOutMin',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountAllowance',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'to',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'v',
            type: 'uint8',
            internalType: 'uint8',
          },
          {
            name: 'r',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 's',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
]
