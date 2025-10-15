"use client";
import React from "react";
import NFTCard from "@/components/nft/NFTCard";
import RippleButton from "@/components/ui/Buttons/RippleButton";

interface MintingSuccessProps {
  nftDetails: {
    nftName: string;
    nftDescription: string;
    image: string;
    attributes: { key: string; value: string }[];
    transactionHash: `0x${string}`;
    tokenId: `0x${string}` | undefined;
  };
  contractAddress: `0x${string}`;
  chainId?: number;
  onMintAnother: () => void;
}

const MintingSuccess: React.FC<MintingSuccessProps> = ({
  nftDetails,
  contractAddress,
  chainId,
  onMintAnother,
}) => {
  return (
    <>
      <h2 className="flex justify-center mt-6 mb-12 text-4xl font-semibold text-white">
        NFT Minted Successfully!
      </h2>
      <div className="flex justify-center">
        <NFTCard
          imageUrl={nftDetails.image}
          nftName={nftDetails.nftName}
          nftDescription={nftDetails.nftDescription}
          attributes={nftDetails.attributes}
          transactionHash={nftDetails.transactionHash}
          contractAddress={contractAddress}
          tokenId={nftDetails.tokenId || "0x0"}
          chainId={chainId}
        />
      </div>
      <div className="flex justify-center mt-14">
        <RippleButton text="Mint Another NFT" onClick={onMintAnother} active />
      </div>
    </>
  );
};

export default MintingSuccess;
