export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFT {
  id: string;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  owner: string;
  contractAddress: string;
  chainId: number;
  metadata?: NFTMetadata;
}

export interface MintResult {
  tokenId: number;
  transactionHash: string;
  contractAddress: string;
}