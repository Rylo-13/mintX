"use client";
import React, { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import mintXABIsepolia from "../../config/abi/mintXsepolia.json";
import { useMintNFT } from "@/hooks/useMintNFT";
import ImageUpload from "./_components/ImageUpload";
import MetadataForm from "./_components/MetadataForm";
import MintingSuccess from "./_components/MintingSuccess";
import ProcessModal from "@/components/ui/ProcessModal";
import AttributesModal from "@/components/ui/AttributesModal";

const MintPage: React.FC = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { openChainModal } = useChainModal();

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setIsGeneratedImageUrl] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageWarning, setImageWarning] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGeneratedTab, setIsGeneratedTab] = useState(false);

  // NFT metadata state
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNFTDescription] = useState("");
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  // Modal state
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);
  const [mintError, setMintError] = useState("");

  // Contract config
  const sepoliaCA = process.env.NEXT_PUBLIC_SEPOLIA_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;

  // Minting hook
  const {
    mintNFT,
    isMinting,
    isSuccess,
    mintedNFT,
    reset: resetMint,
    showMintingModal,
    mintingSteps,
    currentMintingStep,
    mintingError,
    handleCloseMintingModal,
  } = useMintNFT({
    contractAddress: sepoliaCA,
    contractABI: mxABIsepolia,
  });

  // AI image generation mutation
  const generateImageMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await axios.post(
        "api/generateImage",
        { aiImageDescription: description },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.imageUrl;
    },
    onMutate: () => {
      setImageLoaded(false);
      setIsGeneratedImageUrl(null);
      setImageError("");
    },
    onSuccess: (imageUrl) => {
      setIsGeneratedImageUrl(imageUrl);
    },
    onError: (error) => {
      console.error("Error generating images:", error);
      setImageError("Failed to generate image. Please try again.");
    },
  });

  // Handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setImageError(
          "Invalid file type. Please upload JPG, PNG, GIF, or WebP images only."
        );
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setImageError("File size exceeds 10MB. Please choose a smaller file.");
        return;
      }

      setSelectedImage(selectedFile);
      setUploadedImageUrl(URL.createObjectURL(selectedFile));
      setImageError("");
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setIsGeneratedImageUrl(null);
    setImageError("");
    setImageWarning("");
  };

  const handleGenerateImage = () => {
    if (!aiImageDescription) return;
    generateImageMutation.mutate(aiImageDescription);
  };

  const handleMintNFT = () => {
    if (chain?.id !== 11155111) {
      setMintError("Please connect to the Sepolia network.");
      if (switchChain) {
        switchChain({ chainId: 11155111 });
      }
      return;
    }

    if ((!selectedImage && !generatedImageUrl) || !nftName || !nftDescription) {
      return;
    }

    setMintError("");
    mintNFT({
      image: generatedImageUrl || selectedImage,
      name: nftName,
      description: nftDescription,
      attrs: attributes,
    });
  };

  const resetFields = () => {
    setSelectedImage(null);
    setIsGeneratedImageUrl(null);
    setAiImageDescription("");
    setImageError("");
    setImageWarning("");
    setMintError("");
    setIsGeneratedTab(false);
    setUploadedImageUrl(null);
    setNftName("");
    setNFTDescription("");
    setAttributes([{ key: "", value: "" }]);
    setImageLoaded(false);
    generateImageMutation.reset();
    resetMint();
  };

  return (
    <div className="container mx-auto max-w-7xl my-8 pb-8 px-4 md:px-8 lg:px-12">
      {!isSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload/Generation */}
          <ImageUpload
            isGeneratedTab={isGeneratedTab}
            setIsGeneratedTab={setIsGeneratedTab}
            selectedImage={selectedImage}
            uploadedImageUrl={uploadedImageUrl}
            generatedImageUrl={generatedImageUrl}
            aiImageDescription={aiImageDescription}
            setAiImageDescription={setAiImageDescription}
            imageError={imageError}
            imageWarning={imageWarning}
            imageLoaded={imageLoaded}
            setImageLoaded={setImageLoaded}
            showMintingModal={showMintingModal}
            isGeneratingImage={generateImageMutation.isPending}
            onFileInputChange={handleFileInputChange}
            onClearImage={handleClearImage}
            onGenerateImage={handleGenerateImage}
            nftName={nftName}
            nftDescription={nftDescription}
            attributes={attributes}
            chainId={chain?.id}
          />

          {/* Right Column - NFT Metadata */}
          <MetadataForm
            nftName={nftName}
            setNftName={setNftName}
            nftDescription={nftDescription}
            setNftDescription={setNFTDescription}
            attributes={attributes}
            onOpenAttributesModal={() => setIsAttributesModalOpen(true)}
            isConnected={isConnected}
            isMinting={isMinting}
            mintError={mintError}
            selectedImage={selectedImage}
            generatedImageUrl={generatedImageUrl}
            isGeneratedTab={isGeneratedTab}
            imageLoaded={imageLoaded}
            onMintNFT={handleMintNFT}
            chainId={chain?.id}
            onSwitchToSepolia={() => openChainModal?.()}
          />
        </div>
      )}

      {isSuccess && mintedNFT && (
        <MintingSuccess
          nftDetails={mintedNFT}
          contractAddress={sepoliaCA}
          chainId={chain?.id}
          onMintAnother={resetFields}
        />
      )}

      {/* Minting Modal */}
      <ProcessModal
        isOpen={showMintingModal}
        steps={mintingSteps}
        currentStep={currentMintingStep}
        error={mintingError}
        onClose={mintingError ? handleCloseMintingModal : undefined}
        title="Minting Your NFT"
      />

      {/* Attributes Modal */}
      <AttributesModal
        isOpen={isAttributesModalOpen}
        onClose={() => setIsAttributesModalOpen(false)}
        attributes={attributes}
        setAttributes={setAttributes}
      />
    </div>
  );
};

export default MintPage;
