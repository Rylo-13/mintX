"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import NFTCard from "@/components/nft/NFTCard";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import SkeletonCard from "@/components/ui/NFTSkeleton";

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
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        {!imageLoaded && <SkeletonCard />}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: imageLoaded ? "block" : "none" }}
        >
          <NFTCard
            imageUrl={nftDetails.image}
            nftName={nftDetails.nftName}
            nftDescription={nftDetails.nftDescription}
            attributes={nftDetails.attributes}
            transactionHash={nftDetails.transactionHash}
            contractAddress={contractAddress}
            tokenId={nftDetails.tokenId || "0x0"}
            chainId={chainId}
            onImageLoad={() => setImageLoaded(true)}
          />
        </motion.div>
      </div>
      <div className="flex justify-center mt-14">
        <RippleButton text="Mint Another NFT" onClick={onMintAnother} active />
      </div>
    </>
  );
};

export default MintingSuccess;
