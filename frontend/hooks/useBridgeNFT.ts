import { useState, useCallback } from "react";
import { useConfig, useWriteContract, usePublicClient } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { ethers } from "ethers";

export type BridgingStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
};

interface StoredURI {
  tokenId: string;
  uri: string;
  sourceChain: number;
  destinationChain: number;
  timestamp: number;
}

interface MessagingFee {
  nativeFee: bigint;
  lzTokenFee: bigint;
}

interface UseBridgeNFTParams {
  chainId: number;
  address: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  contractABI: any;
  onSuccess?: () => void;
}

export const useBridgeNFT = ({
  chainId,
  address,
  contractAddress,
  contractABI,
  onSuccess,
}: UseBridgeNFTParams) => {
  const config = useConfig();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isBridging, setIsBridging] = useState(false);
  const [isRestoringURI, setIsRestoringURI] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgingModalError, setBridgingModalError] = useState<string | null>(null);
  const [currentBridgingStep, setCurrentBridgingStep] = useState<string | null>(null);

  const [bridgingSteps, setBridgingSteps] = useState<BridgingStep[]>([
    {
      id: "capture",
      title: "Capturing Metadata",
      description: "Saving NFT metadata",
      status: "pending",
    },
    {
      id: "approve",
      title: "Approving Transfer",
      description: "Approving contract",
      status: "pending",
    },
    {
      id: "bridge",
      title: "Bridging NFT",
      description: "Sending to destination chain",
      status: "pending",
    },
  ]);

  const updateBridgingStep = (
    stepId: string,
    status: "pending" | "loading" | "completed" | "error"
  ) => {
    setBridgingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const resetBridgingSteps = () => {
    setBridgingSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const }))
    );
    setCurrentBridgingStep(null);
    setBridgingModalError(null);
  };

  const filterCurrentNetwork = useCallback(() => {
    if (chainId === 11155111) {
      return { eid: 40106 };
    } else if (chainId === 43113) {
      return { eid: 40161 };
    } else {
      throw new Error("Unsupported network");
    }
  }, [chainId]);

  // LocalStorage helpers
  const saveURIForBridge = useCallback(
    (tokenId: string, uri: string, destinationChain: number) => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("pendingBridgeURIs");
        let pendingURIs: StoredURI[] = [];

        if (stored) {
          try {
            pendingURIs = JSON.parse(stored);
          } catch (error) {
            console.error("Error parsing stored URIs:", error);
          }
        }

        const newEntry: StoredURI = {
          tokenId,
          uri,
          sourceChain: chainId,
          destinationChain,
          timestamp: Date.now(),
        };

        pendingURIs.push(newEntry);
        localStorage.setItem("pendingBridgeURIs", JSON.stringify(pendingURIs));
      }
    },
    [chainId]
  );

  const removeStoredURI = useCallback(
    (tokenId: string) => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("pendingBridgeURIs");
        if (stored) {
          try {
            const pendingURIs = JSON.parse(stored);
            const filtered = pendingURIs.filter(
              (item: StoredURI) =>
                !(item.tokenId === tokenId && item.destinationChain === chainId)
            );
            localStorage.setItem("pendingBridgeURIs", JSON.stringify(filtered));
          } catch (error) {
            console.error("Error removing stored URI:", error);
          }
        }
      }
    },
    [chainId]
  );

  const handleBridgeNFT = async (tokenId: number, targetChainId: number) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setIsBridging(true);
    setBridgeStatus(null);
    setShowBridgeModal(true);
    resetBridgingSteps();
    setBridgingModalError(null);

    try {
      // Step 1: Capture the original URI before bridging
      setCurrentBridgingStep("capture");
      updateBridgingStep("capture", "loading");

      const originalURI = (await publicClient?.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "getTokenURIForBridge",
        args: [tokenId],
      })) as string;

      console.log("Original URI captured:", originalURI);

      // Save URI for later restoration
      if (originalURI && originalURI.length > 0) {
        saveURIForBridge(tokenId.toString(), originalURI, targetChainId);
        console.log("URI saved for restoration");
      }

      // Proceed with normal bridging
      const otherNetwork = filterCurrentNetwork();
      console.log("Target chain EID:", otherNetwork.eid);

      const recipientAddressBytes32 = ethers.zeroPadValue(address, 32);

      setBridgeStatus("Creating send parameters...");

      const sendParams = {
        dstEid: otherNetwork.eid,
        to: recipientAddressBytes32,
        tokenId: tokenId,
        extraOptions: "0x",
        composeMsg: "0x",
        onftCmd: "0x",
      };

      setBridgeStatus("Estimating fees...");

      const quote = (await publicClient?.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "quoteSend",
        args: [sendParams, false],
      })) as MessagingFee | undefined;

      if (!quote) {
        throw new Error("Failed to estimate fees");
      }

      updateBridgingStep("capture", "completed");

      // Step 2: Approve the NFT
      setCurrentBridgingStep("approve");
      updateBridgingStep("approve", "loading");

      const approvalTx = await writeContractAsync({
        abi: contractABI,
        address: contractAddress,
        functionName: "approve",
        args: [contractAddress, tokenId],
      });

      await waitForTransactionReceipt(config, {
        hash: approvalTx,
        confirmations: 2,
      });

      updateBridgingStep("approve", "completed");

      // Step 3: Bridge the NFT
      setCurrentBridgingStep("bridge");
      updateBridgingStep("bridge", "loading");

      const sendTx = await writeContractAsync({
        abi: contractABI,
        address: contractAddress,
        functionName: "send",
        args: [
          sendParams,
          { nativeFee: quote.nativeFee, lzTokenFee: quote.lzTokenFee },
          address,
        ],
        value: quote.nativeFee,
      });

      await waitForTransactionReceipt(config, {
        hash: sendTx,
        confirmations: 2,
      });

      updateBridgingStep("bridge", "completed");

      // Brief pause to show completion before closing modal
      setTimeout(() => {
        setShowBridgeModal(false);
        setBridgeStatus(
          "NFT successfully bridged! 🎉 Switch to the destination chain to restore metadata."
        );

        // Clear selections after showing success message
        setTimeout(() => {
          setBridgeStatus(null);
          if (onSuccess) onSuccess();
        }, 5000);
      }, 1000);
    } catch (error) {
      console.error("Error during bridging:", error);
      const errorMessage =
        error instanceof Error
          ? `Bridging failed: ${error.message}`
          : "Bridging failed: An unknown error occurred.";

      setBridgingModalError(errorMessage);

      // Mark current step as error
      if (currentBridgingStep) {
        updateBridgingStep(currentBridgingStep, "error");
      }

      setBridgeStatus(null);
    } finally {
      setIsBridging(false);
      setCurrentBridgingStep(null);
    }
  };

  const handleRestoreURI = async (tokenId: string, pendingURI: StoredURI) => {
    setIsRestoringURI(true);
    setBridgeStatus("Checking if token exists on destination chain...");

    try {
      // First, check if the token exists on the destination chain
      let tokenExists = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!tokenExists && attempts < maxAttempts) {
        try {
          const owner = await publicClient?.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "ownerOf",
            args: [tokenId],
          });

          if (owner && owner !== "0x0000000000000000000000000000000000000000") {
            tokenExists = true;
            console.log(`Token ${tokenId} found on destination chain, owner: ${owner}`);
          }
        } catch (ownerError) {
          console.log(
            `Token ${tokenId} not found yet, attempt ${attempts + 1}/${maxAttempts}`
          );
          setBridgeStatus(
            `Waiting for token to arrive... (${attempts + 1}/${maxAttempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
          attempts++;
        }
      }

      if (!tokenExists) {
        throw new Error(
          "Token has not arrived on destination chain yet. Please wait a few more minutes and try again."
        );
      }

      setBridgeStatus("Token found! Restoring metadata...");

      const restoreTx = await writeContractAsync({
        abi: contractABI,
        address: contractAddress,
        functionName: "setBridgedTokenURI",
        args: [tokenId, pendingURI.uri],
      });

      await waitForTransactionReceipt(config, {
        hash: restoreTx,
        confirmations: 2,
      });

      setBridgeStatus("Metadata successfully restored! 🎉");
      removeStoredURI(tokenId);

      setTimeout(() => {
        setBridgeStatus(null);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Error restoring URI:", error);
      throw error;
    } finally {
      setIsRestoringURI(false);
    }
  };

  const handleCloseBridgeModal = () => {
    setShowBridgeModal(false);
    if (bridgingModalError) {
      setIsBridging(false);
      setCurrentBridgingStep(null);
    }
  };

  return {
    isBridging,
    isRestoringURI,
    bridgeStatus,
    showBridgeModal,
    bridgingSteps,
    currentBridgingStep,
    bridgingModalError,
    handleBridgeNFT,
    handleRestoreURI,
    handleCloseBridgeModal,
    removeStoredURI,
  };
};
