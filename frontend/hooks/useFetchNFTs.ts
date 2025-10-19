import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { getIPFSUrl } from "@/utils/ipfs";
import { getErrorMessage } from "@/utils/errorHandler";

export interface NFTOption {
  value: string;
  label: string;
  hasURI: boolean;
  imageUrl?: string;
  metadata?: any;
}

interface UseFetchNFTsParams {
  isConnected: boolean;
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  contractAddress: `0x${string}` | undefined;
  contractABI: any;
  enabled?: boolean;
}

const minimalERC721ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

export const useFetchNFTs = ({
  isConnected,
  address,
  chainId,
  contractAddress,
  contractABI,
  enabled = true,
}: UseFetchNFTsParams) => {
  const publicClient = usePublicClient();

  const fetchNFTsLogic = async (): Promise<NFTOption[]> => {
    if (!isConnected || !address || !publicClient || !contractAddress || !chainId) {
      return [];
    }

    console.log("=== FETCHING NFTs ===");
    console.log("Chain ID:", chainId);
    console.log("User address:", address);
    console.log("Contract address:", contractAddress);

    // Check if contract exists
    const code = await publicClient.getBytecode({ address: contractAddress });
    if (!code || code === "0x") {
      throw new Error("Contract not found at the specified address");
    }

    // Get NFT count
    const nftCount = (await publicClient.readContract({
      address: contractAddress,
      abi: minimalERC721ABI,
      functionName: "balanceOf",
      args: [address],
    })) as bigint;

    console.log("NFT count:", nftCount.toString());

    if (Number(nftCount) === 0) {
      return [];
    }

    const nftOptions: NFTOption[] = [];

    // Fetch each NFT
    for (let i = 0; i < Number(nftCount); i++) {
      try {
        const tokenId = (await publicClient.readContract({
          address: contractAddress,
          abi: minimalERC721ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(i)],
        })) as bigint;

        const tokenURI = (await publicClient.readContract({
          address: contractAddress,
          abi: minimalERC721ABI,
          functionName: "tokenURI",
          args: [tokenId],
        })) as string;

        const hasURI: boolean = Boolean(tokenURI && tokenURI.length > 0);
        let nftName = `Token #${tokenId.toString()}`;
        let imageUrl = undefined;
        let metadata = undefined;

        if (hasURI) {
          try {
            const resolvedTokenURI = getIPFSUrl(tokenURI);
            const response = await fetch(resolvedTokenURI);
            if (response.ok) {
              metadata = await response.json();
              nftName = metadata.name || nftName;

              // Get image URL
              if (metadata.image) {
                imageUrl = getIPFSUrl(metadata.image);
              }
            }
          } catch (fetchError) {
            console.error("Error fetching metadata:", fetchError);
          }
        }

        nftOptions.push({
          value: tokenId.toString(),
          label: nftName,
          hasURI,
          imageUrl,
          metadata,
        });
      } catch (tokenError) {
        console.error(`Error fetching token at index ${i}:`, tokenError);
      }
    }

    return nftOptions;
  };

  const query = useQuery({
    queryKey: ["nfts", chainId, address, contractAddress],
    queryFn: fetchNFTsLogic,
    enabled: enabled && isConnected && !!address && !!publicClient && !!contractAddress,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    nfts: query.data || [],
    isLoading: query.isPending,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};
