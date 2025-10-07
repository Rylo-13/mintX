"use client";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import { useAccount, useConfig, useWriteContract, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import mintXABIsepolia from "../../../config/abi/mintXsepolia.json";
import NFTCard from "@/components/features/NFTCard";
import ProcessModal from "@/components/ui/ProcessModal";
import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import UploadIcon from "@/components/ui/Icons/UploadIcon";
import { RingLoader } from "react-spinners";
import Image from "next/image";
import AttributesModal from "@/components/ui/AttributesModal";
import Alert from "@/components/ui/Alert";
import { getErrorMessage } from "@/utils/errorHandler";

const ImageUploader: React.FC = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setIsGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [aiImageDescription, setAiImageDescription] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageWarning, setImageWarning] = useState("");
  const [mintError, setMintError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [mintedNFTDetails, setMintedNFTDetails] = useState<any>(null);
  const [isGeneratedTab, setIsGeneratedTab] = useState(false);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNFTDescription] = useState("");
  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >([{ key: "", value: "" }]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);

  // Minting modal states
  const [showMintingModal, setShowMintingModal] = useState(false);
  const [mintingSteps, setMintingSteps] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      status: "pending" | "loading" | "completed" | "error";
    }>
  >([
    {
      id: "upload",
      title: "Uploading to IPFS",
      description: "Storing your NFT data",
      status: "pending",
    },
    {
      id: "mint",
      title: "Minting NFT",
      description: "Creating your NFT on the blockchain",
      status: "pending",
    },
    {
      id: "confirm",
      title: "Confirming",
      description: "Waiting for confirmation",
      status: "pending",
    },
  ]);
  const [currentMintingStep, setCurrentMintingStep] = useState<string | null>(
    null
  );
  const [mintingError, setMintingError] = useState<string | null>(null);

  const sepoliaCA = process.env.NEXT_PUBLIC_SEPOLIA_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;

  // const fujiCA = process.env.NEXT_PUBLIC_FUJI_CA! as `0x${string}`;
  // const mxABIfuji = mintXABIfuji.abi;

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  // Function to get the contract address and ABI based on chain ID
  // const getContractDetails = () => {
  //   if (chain?.id === 11155111) {
  //     console.log("Using Sepolia contract");
  //     return {
  //       address: sepoliaCA,
  //       abi: mxABIsepolia,
  //     };
  //   } else if (chain?.id === 43113) {
  //     console.log("Using Fuji contract");
  //     return {
  //       address: fujiCA,
  //       abi: mxABIfuji,
  //     };
  //   } else {
  //     throw new Error("Unsupported network");
  //   }
  // };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      // Validate file type - only accept common image formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setImageError("Invalid file type. Please upload JPG, PNG, GIF, or WebP images only.");
        return;
      }

      // Validate file size (10MB max for NFTs)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setImageError("File size exceeds 10MB. Please choose a smaller file.");
        return;
      }

      // Warning for small file sizes
      if (selectedFile.size < 100 * 1024) {
        setImageWarning("Image is smaller than 100KB. This may result in low resolution when displayed on marketplaces.");
      } else {
        setImageWarning("");
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

  // Helper function to update step status
  const updateStepStatus = (
    stepId: string,
    status: "pending" | "loading" | "completed" | "error"
  ) => {
    setMintingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  // Helper function to reset all steps to pending
  const resetMintingSteps = () => {
    setMintingSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const }))
    );
    setCurrentMintingStep(null);
    setMintingError(null);
  };

  const handleCloseMintingModal = () => {
    setShowMintingModal(false);
    // If there was an error and user closes modal, reset minting state
    if (mintingError) {
      setIsMinting(false);
      setCurrentMintingStep(null);
    }
  };

  const resetFields = () => {
    setSelectedImage(null);
    setIsGeneratedImageUrl(null);
    setAiImageDescription("");
    setImageError("");
    setImageWarning("");
    setMintError("");
    setIsMinting(false);
    setIsGenerating(false);
    setIsGeneratedTab(false);
    setUploadedImageUrl(null);
    setMintedNFTDetails(null);
    setNftName("");
    setNFTDescription("");
    setAttributes([{ key: "", value: "" }]);
    setIsCompleted(false);
    setImageLoaded(false);
    setShowMintingModal(false);
    resetMintingSteps();
  };

  const handleMintNFT = async () => {
    if (!isConnected) {
      setMintError("Wallet is not connected.");
      return;
    }

    if (chain?.id !== 11155111) {
      setMintError("Please connect to the Sepolia network.");
      if (switchChain) {
        // Prompt user to switch to Sepolia network
        switchChain({ chainId: 11155111 }); // Sepolia network ID
      }
      return;
    }

    if ((!selectedImage && !generatedImageUrl) || !nftName || !nftDescription) {
      return;
    }

    setIsMinting(true);
    setShowMintingModal(true);
    resetMintingSteps();
    setMintingError(null);

    try {
      // Step 1: Upload to IPFS (combines image and metadata upload)
      setCurrentMintingStep("upload");
      updateStepStatus("upload", "loading");

      const imageBuffer = generatedImageUrl
        ? await (
            await axios.get(
              `/api/fetchImageToMint?imageUrl=${encodeURIComponent(
                generatedImageUrl
              )}`,
              { responseType: "arraybuffer" }
            )
          ).data
        : selectedImage
        ? await selectedImage.arrayBuffer()
        : null;

      if (!imageBuffer) {
        throw new Error("No image available for upload");
      }

      const pinFileResponse = await axios.post(
        "/api/pinFileToIPFS",
        imageBuffer,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageHash = pinFileResponse.data.IpfsHash;
      const imageURI = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
      setUploadedImageUrl(imageURI);

      const filteredAttributes = attributes.filter(
        (attr) => attr.key.trim() !== "" && attr.value.trim() !== ""
      );

      const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageURI,
        attributes: filteredAttributes.length > 0 ? filteredAttributes : [],
      };

      const pinJSONResponse = await axios.post("/api/pinJSONToIPFS", metadata, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const metadataURI = `https://gateway.pinata.cloud/ipfs/${pinJSONResponse.data.IpfsHash}`;
      updateStepStatus("upload", "completed");

      console.log("Contract Address:", sepoliaCA);
      console.log("Metadata URI:", metadataURI);
      console.log("Network ID:", chain?.id);

      // Step 2: Mint NFT transaction
      setCurrentMintingStep("mint");
      updateStepStatus("mint", "loading");

      const transactionHash = await writeContractAsync({
        abi: mxABIsepolia,
        address: sepoliaCA,
        functionName: "mintNFT",
        args: [metadataURI],
      });

      console.log("Transaction Hash:", transactionHash);
      updateStepStatus("mint", "completed");

      // Step 3: Wait for confirmation
      setCurrentMintingStep("confirm");
      updateStepStatus("confirm", "loading");

      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
        confirmations: 3,
        timeout: 60000,
      });

      console.log("Transaction Receipt:", receipt);

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed");
      }

      updateStepStatus("confirm", "completed");

      // Extract the token ID from the transaction receipt logs
      const tokenId = receipt.logs[0]?.topics[3];

      setMintedNFTDetails({
        nftName,
        nftDescription,
        image: imageURI,
        attributes: filteredAttributes,
        transactionHash,
        tokenId,
      });

      // Brief pause to show completion before showing NFT card
      setTimeout(() => {
        setShowMintingModal(false);
        setIsCompleted(true);
      }, 1000);

      console.log("Transaction Hash:", transactionHash);
    } catch (err) {
      console.error("Error uploading image or interacting with contract:", err);
      const errorMessage = getErrorMessage(err);
      setMintError(errorMessage);
      setMintingError(errorMessage);

      // Mark current step as error
      if (currentMintingStep) {
        updateStepStatus(currentMintingStep, "error");
      }
    } finally {
      setIsMinting(false);
      setCurrentMintingStep(null);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImageDescription) return;

    setIsGenerating(true);
    setImageLoaded(false);

    try {
      const response = await axios.post(
        "api/generateImage",
        {
          aiImageDescription,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { imageUrl } = response.data;

      setIsGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error("Error generating images:", error);
      setImageError("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl my-8 px-4 pb-8">
      {!isCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload/Generation */}
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-white tracking-tight">
              Create Your NFT
            </h2>

            <div className="flex gap-2 bg-[#0D0D0D] p-1 rounded-xl border border-white/10 mb-4">
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-light text-sm transition-all ${
                  !isGeneratedTab
                    ? "bg-[#FF10F0] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setIsGeneratedTab(false)}
              >
                Upload Image
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-lg font-light text-sm transition-all ${
                  isGeneratedTab
                    ? "bg-[#FF10F0] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setIsGeneratedTab(true)}
              >
                Create Image
              </button>
            </div>

            <motion.div
              animate={{
                height: isGeneratedTab ? 40 : 0,
                marginBottom: isGeneratedTab ? 16 : 0,
                opacity: isGeneratedTab ? 1 : 0
              }}
              initial={false}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input
                  className="w-full px-3 py-2 pr-12 bg-[#0D0D0D] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                  type="text"
                  placeholder="Describe your image..."
                  value={aiImageDescription}
                  onChange={(e) => setAiImageDescription(e.target.value)}
                />
                <button
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    aiImageDescription
                      ? "text-[#FF10F0] hover:bg-[#FF10F0]/10 cursor-pointer"
                      : "text-gray-600 cursor-not-allowed"
                  }`}
                  onClick={handleGenerateImage}
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
              </div>
            </motion.div>

            {!isGeneratedTab && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className={`absolute inset-0 opacity-0 cursor-pointer ${showMintingModal ? 'pointer-events-none' : 'z-10'}`}
                  onChange={handleFileInputChange}
                  disabled={showMintingModal}
                />
                {!selectedImage && (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-400 hover:border-white/20 transition-colors bg-[#0D0D0D]">
                    <UploadIcon className="w-16 h-16 mb-4" />
                    <p className="text-base mb-1 font-light">
                      Click to upload an image
                    </p>
                    <p className="text-base font-light mb-3">or drag and drop here</p>
                    <p className="text-xs text-gray-500 font-light">
                      JPG, PNG, GIF, or WebP • Max 10MB
                    </p>
                  </div>
                )}
                {selectedImage && (
                  <div className="flex justify-center">
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={uploadedImageUrl!}
                        alt="Uploaded Image"
                        className="rounded-2xl relative z-0 object-fill"
                        width={320}
                        height={320}
                        priority
                      />
                      {!showMintingModal && (
                        <button
                          className="absolute -top-3 -right-3 w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full flex items-center justify-center transition-colors border border-white/10 z-20 group"
                          onClick={handleClearImage}
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
                {!generatedImageUrl && !isGenerating && (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-400 bg-[#0D0D0D]">
                    <UploadIcon className="w-16 h-16 mb-4" />
                    <p className="text-base mb-1 font-light">
                      Enter an AI description
                    </p>
                    <p className="text-base font-light">
                      and generate an image!
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex justify-center items-center p-20">
                    <RingLoader color="#FF10F0" size={100} />
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="flex justify-center">
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={generatedImageUrl!}
                        alt="Generated Image"
                        className="rounded-2xl relative z-0 object-fill"
                        width={320}
                        height={320}
                        priority
                        onLoad={() => setImageLoaded(true)}
                      />
                      {imageLoaded && !showMintingModal && (
                        <button
                          className="absolute -top-3 -right-3 w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full flex items-center justify-center transition-colors border border-white/10 group"
                          onClick={handleClearImage}
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

            {/* Image Error/Warning Display */}
            {imageError && (
              <Alert type="error" title="Image Error" message={imageError} className="mt-4" />
            )}
            {imageWarning && !imageError && (
              <Alert type="warning" title="Low Resolution" message={imageWarning} className="mt-4" />
            )}
          </div>

          {/* Right Column - NFT Metadata */}
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-white tracking-tight">
              NFT Details
            </h2>

            <div className="space-y-4">
              <input
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                type="text"
                placeholder="Name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                maxLength={20}
              />

              <textarea
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors resize-none font-light"
                placeholder="Description"
                value={nftDescription}
                onChange={(e) => setNFTDescription(e.target.value)}
                rows={4}
                maxLength={130}
              />
            </div>

            <div className="pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-light">
                  Properties (Optional)
                </label>
                <button
                  className="text-[#FF10F0] hover:text-[#E935C1] text-xs font-light flex items-center gap-1 transition-colors"
                  onClick={() => setIsAttributesModalOpen(true)}
                >
                  <svg
                    className="w-4 h-4"
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
              </div>

              {attributes.filter((attr) => attr.key && attr.value).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attributes
                    .filter((attr) => attr.key && attr.value)
                    .map((attr, index) => (
                      <div
                        key={index}
                        className="bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-2 flex flex-col"
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
                  className="w-full py-2 px-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-sm text-gray-400 hover:border-[#FF10F0] hover:text-white transition-colors flex items-center justify-between font-light"
                  onClick={() => setIsAttributesModalOpen(true)}
                >
                  <span>Add Properties</span>
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

            <RippleButton
              className="w-full text-sm font-light py-2.5"
              text={isMinting ? "Minting..." : "Mint NFT"}
              onClick={handleMintNFT}
              disabled={
                isMinting ||
                (!selectedImage && !generatedImageUrl) ||
                (isGeneratedTab && !imageLoaded) ||
                !nftName ||
                !nftDescription
              }
              active
            />

            {mintError && (
              <Alert type="error" title="Minting Error" message={mintError} className="mt-4" />
            )}
          </div>
        </div>
      )}

      {isCompleted && mintedNFTDetails && (
        <>
          <h2 className="flex justify-center mt-6 mb-12 text-4xl font-semibold text-white">
            NFT Minted Successfully!
          </h2>
          <NFTCard
            imageUrl={mintedNFTDetails.image}
            nftName={mintedNFTDetails.nftName}
            nftDescription={mintedNFTDetails.nftDescription}
            attributes={mintedNFTDetails.attributes}
            transactionHash={mintedNFTDetails.transactionHash}
            contractAddress={sepoliaCA}
            tokenId={mintedNFTDetails.tokenId}
            chainId={chain?.id}
          />
          <div className="flex justify-center mt-14">
            <RippleButton
              text="Mint Another NFT"
              onClick={resetFields}
              active
            />
          </div>
        </>
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

export default ImageUploader;
