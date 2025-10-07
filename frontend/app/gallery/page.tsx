"use client";
import React, { useState, useEffect, useCallback } from "react";
import NFTCard from "@/components/features/NFTCard";
import SkeletonCard from "@/components/ui/NFTSkeleton";
import { useAccount, useReadContract, usePublicClient, useConfig } from "wagmi";
import mintXABIsepolia from "../../config/abi/mintXsepolia.json";
import mintXABIfuji from "../../config/abi/mintXfuji.json";

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
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const NFTsPerPage = 8;

  const publicClient = usePublicClient();

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

  const fetchNFTs = useCallback(
    async (page: number) => {
      if (
        !address ||
        !publicClient ||
        nftCount === undefined ||
        loadingMore ||
        chain?.id === null
      ) {
        return;
      }

      try {
        setLoadingMore(true);
        const { address: contractAddress, abi } = getContractDetails();

        if (Number(nftCount) === 0) {
          setLoadingInitial(false);
          return;
        }

        const fetchedNFTs: NFT[] = [];
        const start = (page - 1) * NFTsPerPage;
        const end = Math.min(start + NFTsPerPage, Number(nftCount));

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

          let resolvedTokenURI = tokenURI;
          if (tokenURI.startsWith("ipfs://")) {
            resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          }

          console.log("Fetching metadata from:", resolvedTokenURI);

          try {
            const response = await fetch(resolvedTokenURI);

            // Log the full response object
            console.log("Full response object:", response);

            // Log the response body as JSON
            const metadata = await response.json();
            console.log("Response body:", metadata);

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

        const fetchedNFTsMap = new Map(
          fetchedNFTs.map((nft) => [nft.tokenId, nft])
        );
        const existingNFTsMap = new Map(nfts.map((nft) => [nft.tokenId, nft]));
        const allNFTsMap = new Map([...existingNFTsMap, ...fetchedNFTsMap]);
        setNfts(Array.from(allNFTsMap.values()));
        setCurrentPage(page + 1);
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
      } finally {
        setLoadingMore(false);
        setLoadingInitial(false);
      }
    },
    [address, publicClient, nftCount, loadingMore, chain?.id, nfts]
  );

  useEffect(() => {
    if (loadingInitial && chain?.id !== null) {
      fetchNFTs(currentPage);
    }
  }, [loadingInitial, fetchNFTs, currentPage, chain?.id]);

  useEffect(() => {
    if (chain?.id !== null) {
      setNfts([]);
      setCurrentPage(1);
      setLoadingInitial(true);
    }
  }, [chain?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 30 >=
        document.documentElement.offsetHeight
      ) {
        if (!loadingMore && !loadingInitial) {
          fetchNFTs(currentPage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, loadingInitial, currentPage, fetchNFTs]);

  return (
    <div className="container mx-auto max-w-7xl my-8 px-4 pb-8">
      <h2 className="text-3xl font-light text-white tracking-tight mb-8">Your NFT Gallery</h2>
      {!loadingInitial && nfts.length === 0 ? (
        <p className="text-center text-white">No NFTs found.</p>
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
          {loadingMore &&
            Array.from({ length: NFTsPerPage }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Page;
