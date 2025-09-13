export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTokenId = (tokenId: string | number): string => {
  return `#${tokenId}`;
};

export const formatChainName = (chainId: number): string => {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    11155111: 'Sepolia',
    43113: 'Avalanche Fuji',
    43114: 'Avalanche',
  };
  return chainNames[chainId] || `Chain ${chainId}`;
};

export const formatTransactionHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};