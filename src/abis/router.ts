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
] as const

export const bondingCurveRouterAbi = [
  {
    type: 'function',
    name: 'availableBuyTokens',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'availableBuyToken',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'requiredMonAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'buy',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.BuyParams',
        components: [
          {
            name: 'amountOutMin',
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
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'create',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.TokenCreationParams',
        components: [
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'name',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'symbol',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'tokenURI',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'amountOut',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'pool',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'curve',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'exactOutBuy',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.ExactOutBuyParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'exactOutSell',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.ExactOutSellParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'exactOutSellPermit',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.ExactOutSellPermitParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAmountIn',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'is_buy',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAmountOut',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'is_buy',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'sell',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.SellParams',
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
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sellPermit',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.SellPermitParams',
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
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'wMon',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'error',
    name: 'DeadlineExpired',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAmountIn',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAmountInMax',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAmountOut',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientMon',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAllowance',
    inputs: [],
  },
] as const

// Generated ABI for DexRouter
// Source: IDexRouter.json

export const dexRouterAbi = [
  {
    type: 'function',
    name: 'buy',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.BuyParams',
        components: [
          {
            name: 'amountOutMin',
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
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'calculateFeeAmount',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'feeAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'exactOutBuy',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.ExactOutBuyParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
        ],
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'exactOutSell',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.ExactOutSellParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
        ],
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'exactOutSellPermit',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.ExactOutSellPermitParams',
        components: [
          {
            name: 'amountInMax',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'amountOut',
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
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAmountIn',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'is_buy',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAmountOut',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'is_buy',
        type: 'bool',
        internalType: 'bool',
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
  {
    type: 'function',
    name: 'sell',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.SellParams',
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
  {
    type: 'function',
    name: 'sellPermit',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IDexRouter.SellPermitParams',
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
  {
    type: 'function',
    name: 'splitAmountAndFee',
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'isBuy',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'fee',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'DexRouterBuy',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DexRouterSell',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'ExpiredDeadLine',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientInput',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientOutput',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmountIn',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmountOut',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidCallback',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: [],
  },
] as const
