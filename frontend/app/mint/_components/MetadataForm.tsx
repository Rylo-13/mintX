"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

interface MetadataFormProps {
  nftName: string;
  setNftName: (value: string) => void;
  nftDescription: string;
  setNftDescription: (value: string) => void;
  attributes: { key: string; value: string }[];
  onOpenAttributesModal: () => void;
  isConnected: boolean;
  isMinting: boolean;
  mintError: string;
  selectedImage: File | null;
  generatedImageUrl: string | null;
  isGeneratedTab: boolean;
  imageLoaded: boolean;
  onMintNFT: () => void;
  chainId?: number;
  onSwitchToSepolia: () => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({
  nftName,
  setNftName,
  nftDescription,
  setNftDescription,
  attributes,
  onOpenAttributesModal,
  isConnected,
  isMinting,
  mintError,
  selectedImage,
  generatedImageUrl,
  isGeneratedTab,
  imageLoaded,
  onMintNFT,
  chainId,
  onSwitchToSepolia,
}) => {
  const isWrongChain = isConnected && chainId !== 11155111;
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-light text-white tracking-tight">
        NFT Details
      </h2>

      <div className="space-y-6">
        <Input
          value={nftName}
          onChange={setNftName}
          placeholder="Name"
          maxLength={20}
        />

        <Input
          value={nftDescription}
          onChange={setNftDescription}
          placeholder="Description"
          multiline
          rows={4}
          maxLength={118}
          className="py-2"
        />
      </div>

      <div className="pt-0.5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-400 font-light">
            Traits (Optional)
          </label>
          {attributes.filter((attr) => attr.key && attr.value).length > 0 && (
            <button
              className="text-[#FF10F0] hover:text-[#E935C1] flex items-center gap-1 transition-colors"
              onClick={onOpenAttributesModal}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>

        {attributes.filter((attr) => attr.key && attr.value).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attributes
              .filter((attr) => attr.key && attr.value)
              .map((attr, index) => (
                <div
                  key={index}
                  className="bg-[#0D0D0D] border border-white/10 rounded-2xl px-3 py-2 flex flex-col"
                >
                  <span className="text-xs text-gray-400 font-light mb-0.5">
                    {attr.key}
                  </span>
                  <span className="text-sm text-white font-light">
                    {attr.value}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <button
            className="w-full py-2 px-3 bg-[#0D0D0D] border border-white/10 rounded-2xl text-sm text-gray-400 hover:border-[#FF10F0] hover:text-white transition-colors flex items-center justify-between font-light"
            onClick={onOpenAttributesModal}
          >
            <span>Add Traits</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {isWrongChain && (
        <Alert
          type="warning"
          title="Wrong Network"
          message="Minting is only available on Sepolia testnet. Please switch networks to continue."
          className="mb-2"
        />
      )}

      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <RippleButton
            className="w-full text-sm font-light py-2.5"
            text={
              !isConnected
                ? "Connect Wallet"
                : isWrongChain
                ? "Switch to Sepolia"
                : isMinting
                ? "Minting..."
                : "Mint NFT"
            }
            onClick={
              !isConnected
                ? openConnectModal
                : isWrongChain
                ? onSwitchToSepolia
                : onMintNFT
            }
            disabled={
              isConnected &&
              !isWrongChain &&
              (isMinting ||
                (!selectedImage && !generatedImageUrl) ||
                (isGeneratedTab && !imageLoaded) ||
                !nftName ||
                !nftDescription)
            }
            active
          />
        )}
      </ConnectButton.Custom>

      {mintError && !isWrongChain && (
        <Alert
          type="error"
          title="Minting Error"
          message={mintError}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default MetadataForm;
