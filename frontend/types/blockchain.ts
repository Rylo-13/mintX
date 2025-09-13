export interface ChainConfig {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  contractAddress: string;
}

export interface BridgeTransaction {
  fromChain: number;
  toChain: number;
  tokenId: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletState {
  address?: string;
  isConnected: boolean;
  chainId?: number;
}