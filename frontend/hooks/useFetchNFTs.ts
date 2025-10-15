import { useState, useCallback, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { getIPFSUrl } from "@/utils/ipfs";

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
  chainId: number;
  sepoliaCA: `0x${string}`;
  fujiCA: `0x${string}`;
}

export const useFetchNFTs = ({
  isConnected,
  address,
  chainId,
  sepoliaCA,
  fujiCA,
}: UseFetchNFTsParams) => {
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<NFTOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("=== FETCHING NFTs ===");
      console.log("Chain ID:", chainId);
      console.log("User address:", address);

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

      const nftOptions: NFTOption[] = [];
      let currentCA: `0x${string}`;

      if (chainId === 11155111) {
        currentCA = sepoliaCA;
      } else if (chainId === 43113) {
        currentCA = fujiCA;
      } else {
        setError("Unsupported network");
        setIsLoading(false);
        return;
      }

      // Check if contract exists
      const code = await publicClient.getBytecode({ address: currentCA });
      if (!code || code === "0x") {
        setError("Contract not found at the specified address");
        setIsLoading(false);
        return;
      }

      const nftCount = (await publicClient.readContract({
        address: currentCA,
        abi: minimalERC721ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      console.log("NFT count:", nftCount.toString());

      if (Number(nftCount) === 0) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      for (let i = 0; i < Number(nftCount); i++) {
        try {
          const tokenId = (await publicClient.readContract({
            address: currentCA,
            abi: minimalERC721ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          })) as bigint;

          const tokenURI = (await publicClient.readContract({
            address: currentCA,
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

      setNfts(nftOptions);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setError(`Failed to fetch NFTs: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, publicClient, chainId, sepoliaCA, fujiCA]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchNFTs,
  };
};
