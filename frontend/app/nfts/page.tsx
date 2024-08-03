"use client";

import React, { useState, useEffect } from "react";
import NFTCard from "@/components/NFTCard"; // Import your existing NFTCard component
import RippleButton from "@/components/Buttons/RippleButton"; // Optional: If you have a custom RippleButton component
import { useAccount, useReadContract, usePublicClient } from "wagmi"; // Import hooks from wagmi
import contractABI from "../../aiArtABI.json";

// Define the NFT type
type NFT = {
  imageUrl: string;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  transactionHash: string;
};

const Page: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [currentNFTs, setCurrentNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount(); // Get the connected wallet address
  const publicClient = usePublicClient(); // Get the public client
  const NFTsPerPage = 12;

  const contractAddress = "0x6B947C9D26a2dd2b7f18b0e54Aad1e35918d6Dad";
  const abi = contractABI.abi;

  const { data: nftCount } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "balanceOf",
    args: [address],
  });

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !publicClient || typeof nftCount !== "bigint") {
        console.log("Missing or incorrect dependencies:", {
          address,
          publicClient,
          nftCount,
        });
        return;
      }

      try {
        setLoading(true);
        const fetchedNFTs = [];
        for (let i = 0; i < Number(nftCount); i++) {
          const tokenId = (await publicClient.readContract({
            address: contractAddress,
            abi: abi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          })) as bigint;

          console.log(`Fetched tokenId for index ${i}: ${tokenId}`);

          const tokenURI = (await publicClient.readContract({
            address: contractAddress,
            abi: abi,
            functionName: "tokenURI",
            args: [tokenId],
          })) as string;

          console.log(`Fetched tokenURI for tokenId ${tokenId}: ${tokenURI}`);

          let resolvedTokenURI = tokenURI;
          if (tokenURI.startsWith("ipfs://")) {
            resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          }

          const response = await fetch(resolvedTokenURI);
          const metadata = await response.json();

          console.log(`Fetched metadata for tokenURI ${tokenURI}:`, metadata);

          fetchedNFTs.push({
            imageUrl: metadata.image,
            nftName: metadata.name,
            nftDescription: metadata.description,
            attributes: metadata.attributes,
            transactionHash: "", // You can populate this if you have transaction hashes
          });
        }

        setNfts(fetchedNFTs);
        const start = (currentPage - 1) * NFTsPerPage;
        const end = start + NFTsPerPage;
        setCurrentNFTs(fetchedNFTs.slice(start, end));
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address, publicClient, nftCount]);

  useEffect(() => {
    const start = (currentPage - 1) * NFTsPerPage;
    const end = start + NFTsPerPage;
    setCurrentNFTs(nfts.slice(start, end));
  }, [currentPage, nfts]);

  const totalPages = Math.ceil(nfts.length / NFTsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mt-8 mb-14 text-white">
        Your NFTs
      </h1>
      {loading ? (
        <p className="text-center text-white">Loading NFTs...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {currentNFTs.map((nft, index) => (
              <NFTCard
                key={index}
                imageUrl={nft.imageUrl}
                nftName={nft.nftName}
                nftDescription={nft.nftDescription}
                attributes={nft.attributes}
                transactionHash={nft.transactionHash}
              />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <RippleButton
              className="mr-2"
              text="Previous"
              onClick={handlePrevPage}
              active={currentPage > 1}
            />
            <RippleButton
              text="Next"
              onClick={handleNextPage}
              active={currentPage < totalPages}
            />
          </div>
          <p className="text-center mt-4 text-white">
            Page {currentPage} of {totalPages}
          </p>
        </>
      )}
    </div>
  );
};

export default Page;
