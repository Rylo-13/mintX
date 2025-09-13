import { ChainConfig } from '@/types';

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    contractAddress: '0x...', // Replace with actual contract address
  },
  43113: {
    id: 43113,
    name: 'Avalanche Fuji',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
    contractAddress: '0x...', // Replace with actual contract address
  },
};

export const DEFAULT_CHAIN_ID = 11155111;