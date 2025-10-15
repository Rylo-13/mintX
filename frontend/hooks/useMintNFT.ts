import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import axios from "axios";
import { getIPFSUrl } from "@/utils/ipfs";
import { getErrorMessage } from "@/utils/errorHandler";

export type MintingStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
};

export interface UseMintNFTParams {
  contractAddress: `0x${string}`;
  contractABI: any;
}

export const useMintNFT = ({ contractAddress, contractABI }: UseMintNFTParams) => {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [showMintingModal, setShowMintingModal] = useState(false);
  const [currentMintingStep, setCurrentMintingStep] = useState<string | null>(null);
  const [mintingError, setMintingError] = useState<string | null>(null);
  const [mintingSteps, setMintingSteps] = useState<MintingStep[]>([
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

  const updateStepStatus = (
    stepId: string,
    status: "pending" | "loading" | "completed" | "error"
  ) => {
    setMintingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const resetMintingSteps = () => {
    setMintingSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const }))
    );
    setCurrentMintingStep(null);
    setMintingError(null);
  };

  const mintNFTMutation = useMutation({
    mutationFn: async ({
      image,
      name,
      description,
      attrs,
    }: {
      image: File | string | null;
      name: string;
      description: string;
      attrs: { key: string; value: string }[];
    }) => {
      // Step 1: Upload to IPFS
      updateStepStatus("upload", "loading");

      const imageBuffer =
        typeof image === "string"
          ? await (
              await axios.get(
                `/api/fetchImageToMint?imageUrl=${encodeURIComponent(image)}`,
                { responseType: "arraybuffer" }
              )
            ).data
          : image instanceof File
          ? await image.arrayBuffer()
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
      const imageURI = getIPFSUrl(imageHash);

      const filteredAttributes = attrs.filter(
        (attr) => attr.key.trim() !== "" && attr.value.trim() !== ""
      );

      const metadata = {
        name,
        description,
        image: imageURI,
        attributes: filteredAttributes.length > 0 ? filteredAttributes : [],
      };

      const pinJSONResponse = await axios.post("/api/pinJSONToIPFS", metadata, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const metadataURI = getIPFSUrl(pinJSONResponse.data.IpfsHash);
      updateStepStatus("upload", "completed");

      console.log("Contract Address:", contractAddress);
      console.log("Metadata URI:", metadataURI);

      // Step 2: Mint NFT transaction
      updateStepStatus("mint", "loading");

      const transactionHash = await writeContractAsync({
        abi: contractABI,
        address: contractAddress,
        functionName: "mintNFT",
        args: [metadataURI],
      });

      console.log("Transaction Hash:", transactionHash);
      updateStepStatus("mint", "completed");

      // Step 3: Wait for confirmation
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

      return {
        nftName: name,
        nftDescription: description,
        image: imageURI,
        attributes: filteredAttributes,
        transactionHash,
        tokenId,
      };
    },
    onMutate: () => {
      setShowMintingModal(true);
      resetMintingSteps();
      setMintingError(null);
      setCurrentMintingStep("upload");
    },
    onSuccess: () => {
      // Brief pause to show completion before showing NFT card
      setTimeout(() => {
        setShowMintingModal(false);
        setCurrentMintingStep(null);
      }, 1000);
    },
    onError: (err) => {
      console.error("Error uploading image or interacting with contract:", err);
      const errorMessage = getErrorMessage(err);
      setMintingError(errorMessage);

      // Find which step failed
      const currentStep = mintingSteps.find((step) => step.status === "loading");
      if (currentStep) {
        console.log("Setting step to error:", currentStep.id);
        updateStepStatus(currentStep.id, "error");
      }
    },
  });

  const handleCloseMintingModal = () => {
    setShowMintingModal(false);
    // If there was an error and user closes modal, reset state
    if (mintingError) {
      setCurrentMintingStep(null);
    }
  };

  return {
    mintNFT: mintNFTMutation.mutate,
    isMinting: mintNFTMutation.isPending,
    isSuccess: mintNFTMutation.isSuccess,
    isError: mintNFTMutation.isError,
    mintedNFT: mintNFTMutation.data,
    error: mintNFTMutation.error,
    reset: mintNFTMutation.reset,
    showMintingModal,
    mintingSteps,
    currentMintingStep,
    mintingError,
    handleCloseMintingModal,
  };
};
