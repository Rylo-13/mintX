"use client";
import React from "react";
import { motion } from "framer-motion";
import NFTCard from "@/components/nft/NFTCard";
import UploadIcon from "@/components/ui/Icons/UploadIcon";
import { RingLoader } from "react-spinners";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

interface ImageUploadProps {
  isGeneratedTab: boolean;
  setIsGeneratedTab: (value: boolean) => void;
  selectedImage: File | null;
  uploadedImageUrl: string | null;
  generatedImageUrl: string | null;
  aiImageDescription: string;
  setAiImageDescription: (value: string) => void;
  imageError: string;
  imageWarning: string;
  imageLoaded: boolean;
  setImageLoaded: (value: boolean) => void;
  showMintingModal: boolean;
  isGeneratingImage: boolean;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onGenerateImage: () => void;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  chainId?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  isGeneratedTab,
  setIsGeneratedTab,
  selectedImage,
  uploadedImageUrl,
  generatedImageUrl,
  aiImageDescription,
  setAiImageDescription,
  imageError,
  imageWarning,
  imageLoaded,
  setImageLoaded,
  showMintingModal,
  isGeneratingImage,
  onFileInputChange,
  onClearImage,
  onGenerateImage,
  nftName,
  nftDescription,
  attributes,
  chainId,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-light text-white tracking-tight">
        Create Your NFT
      </h2>

      <div className="space-y-6">
        <div className="flex gap-2 bg-[#0D0D0D] p-1 rounded-2xl border border-white/10">
          <button
            className={`flex-1 py-2 px-4 rounded-2xl font-light text-sm transition-all relative overflow-hidden ${
              !isGeneratedTab
                ? "bg-[#FF10F0] text-white hover:bg-[#E935C1]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            onClick={() => setIsGeneratedTab(false)}
          >
            Upload Image
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-2xl font-light text-sm transition-all relative overflow-hidden ${
              isGeneratedTab
                ? "bg-[#FF10F0] text-white hover:bg-[#E935C1]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            onClick={() => setIsGeneratedTab(true)}
          >
            Create Image
          </button>
        </div>

        <motion.div
          animate={{
            height: isGeneratedTab ? "auto" : 0,
            opacity: isGeneratedTab ? 1 : 0,
            marginBottom: isGeneratedTab ? 0 : -24,
          }}
          initial={false}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <Input
            value={aiImageDescription}
            onChange={setAiImageDescription}
            placeholder="Describe your image..."
            className="py-2"
            rightElement={
              <button
                className={`p-1.5 rounded-full transition-colors ${
                  aiImageDescription
                    ? "text-[#FF10F0] hover:bg-[#FF10F0]/10 cursor-pointer"
                    : "text-gray-600 cursor-not-allowed"
                }`}
                onClick={onGenerateImage}
                disabled={!aiImageDescription}
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
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            }
          />
        </motion.div>

        {!isGeneratedTab && (
          <div className="relative">
            {!selectedImage && (
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className={`absolute inset-0 opacity-0 cursor-pointer ${
                  showMintingModal ? "pointer-events-none" : "z-10"
                }`}
                onChange={onFileInputChange}
                disabled={showMintingModal}
              />
            )}
            {!selectedImage && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-400 hover:border-white/20 transition-colors bg-[#0D0D0D]">
                <UploadIcon className="w-16 h-16 mb-4" />
                <p className="text-base mb-1 font-light">
                  Click to upload an image
                </p>
                <p className="text-base font-light mb-3">
                  or drag and drop here
                </p>
                <p className="text-xs text-gray-500 font-light">
                  JPG, PNG, GIF, or WebP • Max 10MB
                </p>
              </div>
            )}
            {selectedImage && (
              <div className="flex justify-center">
                <motion.div
                  className="relative w-full max-w-[340px]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <NFTCard
                    imageUrl={uploadedImageUrl!}
                    nftName={nftName || "Untitled NFT"}
                    nftDescription={nftDescription || "No description"}
                    attributes={attributes}
                    chainId={chainId}
                    isPreview={true}
                  />
                  {!showMintingModal && (
                    <button
                      className="absolute -top-3 -right-3 w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full flex items-center justify-center transition-colors border border-white/10 z-20 group"
                      onClick={onClearImage}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        )}

        {isGeneratedTab && (
          <div>
            {!generatedImageUrl && !isGeneratingImage && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-400 bg-[#0D0D0D]">
                <UploadIcon className="w-16 h-16 mb-4" />
                <p className="text-base mb-1 font-light">
                  Enter an AI description
                </p>
                <p className="text-base font-light">and generate an image!</p>
              </div>
            )}

            {isGeneratingImage && (
              <div className="flex justify-center items-center p-20">
                <RingLoader color="#FF10F0" size={100} />
              </div>
            )}

            {generatedImageUrl && (
              <div className="flex justify-center">
                <motion.div
                  className="relative w-full max-w-[340px]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <NFTCard
                    imageUrl={generatedImageUrl}
                    nftName={nftName || "Untitled NFT"}
                    nftDescription={nftDescription || "No description"}
                    attributes={attributes}
                    chainId={chainId}
                    isPreview={true}
                    onImageLoad={() => setImageLoaded(true)}
                  />
                  {imageLoaded && !showMintingModal && (
                    <button
                      className="absolute -top-3 -right-3 w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full flex items-center justify-center transition-colors border border-white/10 z-20 group"
                      onClick={onClearImage}
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Error/Warning Display */}
      {imageError && (
        <Alert
          type="error"
          title="Image Error"
          message={imageError}
          className="mt-4"
        />
      )}
      {imageWarning && !imageError && (
        <Alert
          type="warning"
          title="Low Resolution"
          message={imageWarning}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default ImageUpload;
