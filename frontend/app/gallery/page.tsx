"use client";
import React, { useEffect } from "react";
import NFTCard from "@/components/features/NFTCard";
import SkeletonCard from "@/components/ui/NFTSkeleton";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useInfiniteQuery } from "@tanstack/react-query";
import mintXABIsepolia from "../../config/abi/mintXsepolia.json";
import mintXABIfuji from "../../config/abi/mintXfuji.json";
import { getIPFSUrl } from "@/utils/ipfs";

type NFT = {
  tokenId: string;
  imageUrl: string;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  transactionHash: string;
  contractAddress: string;
};

const Page: React.FC = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const NFTsPerPage = 8;

  const sepoliaCA = process.env.NEXT_PUBLIC_SEPOLIA_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;

  const fujiCA = process.env.NEXT_PUBLIC_FUJI_CA as `0x${string}`;
  const mxABIfuji = mintXABIfuji.abi;

  const getContractDetails = () => {
    if (chain?.id === 11155111) {
      return {
        address: sepoliaCA,
        abi: mxABIsepolia,
      };
    } else {
      return {
        address: fujiCA,
        abi: mxABIfuji,
      };
    }
  };

  const { data: nftCount } = useReadContract({
    address: chain?.id ? getContractDetails().address : undefined,
    abi: chain?.id ? getContractDetails().abi : undefined,
    functionName: "balanceOf",
    args: [address],
  });

  // useInfiniteQuery handles pagination and infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["nfts", address, chain?.id, nftCount?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!address || !publicClient || !chain?.id) {
        return { nfts: [], nextPage: undefined };
      }

      // If nftCount is 0, return empty immediately
      if (Number(nftCount) === 0) {
        return { nfts: [], nextPage: undefined };
      }

      const { address: contractAddress, abi } = getContractDetails();
      const fetchedNFTs: NFT[] = [];
      const start = pageParam * NFTsPerPage;
      const end = Math.min(start + NFTsPerPage, Number(nftCount || 0));

      for (let i = start; i < end; i++) {
        const tokenId = (await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(i)],
        })) as bigint;

        const tokenURI = (await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "tokenURI",
          args: [tokenId],
        })) as string;

        const resolvedTokenURI = getIPFSUrl(tokenURI);

        try {
          const response = await fetch(resolvedTokenURI);
          const metadata = await response.json();

          fetchedNFTs.push({
            imageUrl: metadata.image,
            nftName: metadata.name,
            nftDescription: metadata.description,
            attributes: metadata.attributes,
            transactionHash: metadata.transactionHash,
            tokenId: tokenId.toString(),
            contractAddress,
          });
        } catch (error) {
          console.error("Failed to fetch metadata:", error);
        }
      }

      const nextPage = end < Number(nftCount || 0) ? pageParam + 1 : undefined;

      return { nfts: fetchedNFTs, nextPage };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!address && !!chain?.id && nftCount !== undefined,
  });

  // Flatten all pages into single array
  const nfts = data?.pages.flatMap((page) => page.nfts) ?? [];

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 30 >=
        document.documentElement.offsetHeight
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="container mx-auto max-w-7xl my-8 px-4 pb-8">
      <h2 className="text-3xl font-light text-white tracking-tight mb-8">Your NFT Gallery</h2>
      {!address ? (
        <p className="text-center text-white text-base font-light">Please connect your wallet to view your NFTs.</p>
      ) : isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {Array.from({ length: NFTsPerPage }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
          ))}
        </div>
      ) : nfts.length === 0 ? (
        <p className="text-center text-white text-base font-light">No NFTs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {nfts.map((nft, index) => {
            const { address: contractAddress } = getContractDetails();
            return (
              <NFTCard
                key={`${nft.tokenId}-${index}`}
                imageUrl={nft.imageUrl}
                nftName={nft.nftName}
                nftDescription={nft.nftDescription}
                attributes={nft.attributes}
                transactionHash={nft.transactionHash}
                contractAddress={contractAddress}
                tokenId={nft.tokenId}
                chainId={chain?.id}
              />
            );
          })}
          {isFetchingNextPage &&
            Array.from({ length: NFTsPerPage }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Page;
