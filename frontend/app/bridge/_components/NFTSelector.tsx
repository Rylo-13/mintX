"use client";
import React from "react";
import Dropdown from "@/components/ui/Dropdown";

interface NFTOption {
  value: string;
  label: string;
  hasURI: boolean;
  imageUrl?: string;
  metadata?: any;
}

interface NFTSelectorProps {
  nfts: NFTOption[];
  selectedTokenId: number | null;
  onSelectToken: (tokenId: number) => void;
  isBridging: boolean;
}

const NFTSelector: React.FC<NFTSelectorProps> = ({
  nfts,
  selectedTokenId,
  onSelectToken,
  isBridging,
}) => {
  const selectedNFT = selectedTokenId
    ? nfts.find((nft) => nft.value === selectedTokenId.toString())
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-light text-white tracking-tight">
        Select NFT
      </h2>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block font-light">
          NFT to Bridge
        </label>
        <Dropdown
          options={nfts.map((nft) => ({
            value: nft.value,
            label: `${nft.label} (ID: ${nft.value})${
              !nft.hasURI ? " ⚠️ No Metadata" : ""
            }`,
          }))}
          value={selectedTokenId}
          onChange={(value) => onSelectToken(Number(value))}
          placeholder={
            nfts.length === 0 ? "No NFTs available" : "Choose an NFT..."
          }
          disabled={isBridging}
        />
      </div>

      {selectedNFT && selectedNFT.imageUrl && (
        <div className="flex justify-center">
          <img
            src={selectedNFT.imageUrl}
            alt={selectedNFT.label}
            className="w-80 h-80 object-fill rounded-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NFTSelector;
