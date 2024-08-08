"use client";
import React, { useState, useEffect, useCallback } from "react";
import NFTCard from "@/components/NFTCard";
import SkeletonCard from "@/components/NFTSkeleton";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import contractABI from "../../aiArtABI.json";

type NFT = {
  tokenId: string;
  imageUrl: string;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  transactionHash: string;
};

const Page: React.FC = () => {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const NFTsPerPage = 8;

  const publicClient = usePublicClient();
  const mintCA = process.env.MINT_CONTRACT! as `0x${string}`;
  const abi = contractABI.abi;

  const { data: nftCount } = useReadContract({
    address: mintCA,
    abi: abi,
    functionName: "balanceOf",
    args: [address],
  });

  const fetchNFTs = useCallback(async () => {
    if (!address || !publicClient || !nftCount || isFetchingMore) {
      return;
    }

    try {
      setIsFetchingMore(true);
      const fetchedNFTs: NFT[] = [];
      const start = (currentPage - 1) * NFTsPerPage;
      const end = Math.min(start + NFTsPerPage, Number(nftCount));

      for (let i = start; i < end; i++) {
        const tokenId = (await publicClient.readContract({
          address: mintCA,
          abi: abi,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(i)],
        })) as bigint;

        const tokenURI = (await publicClient.readContract({
          address: mintCA,
          abi: abi,
          functionName: "tokenURI",
          args: [tokenId],
        })) as string;

        let resolvedTokenURI = tokenURI;
        if (tokenURI.startsWith("ipfs://")) {
          resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
        }

        const response = await fetch(resolvedTokenURI);
        const metadata = await response.json();

        fetchedNFTs.push({
          imageUrl: metadata.image,
          nftName: metadata.name,
          nftDescription: metadata.description,
          attributes: metadata.attributes,
          transactionHash: "",
          tokenId: tokenId.toString(),
        });
      }

      setNfts((prevNFTs) => {
        const uniqueNFTs = [...prevNFTs, ...fetchedNFTs].reduce((acc, nft) => {
          const exists = acc.find((item) => item.tokenId === nft.tokenId);
          if (!exists) acc.push(nft);
          return acc;
        }, [] as NFT[]);
        return uniqueNFTs;
      });

      setCurrentPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
    } finally {
      setIsFetchingMore(false);
      setLoading(false);
    }
  }, [address, publicClient, nftCount, currentPage, isFetchingMore]);

  useEffect(() => {
    if (loading) {
      fetchNFTs();
    }
  }, [loading, fetchNFTs]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 30 >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetchingMore && !loading) {
          setLoading(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, loading]);

  return (
    <div className="container mx-auto p-4 mb-10">
      <h1 className="text-4xl font-bold text-center mt-8 mb-14 text-white">
        Your NFTs
      </h1>
      {nfts.length === 0 && !loading ? (
        <p className="text-center text-white">No NFTs found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                imageUrl={nft.imageUrl}
                nftName={nft.nftName}
                nftDescription={nft.nftDescription}
                attributes={nft.attributes}
                transactionHash={nft.transactionHash}
                mintCA={mintCA}
                tokenId={nft.tokenId}
              />
            ))}
            {loading &&
              Array.from({ length: NFTsPerPage }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
