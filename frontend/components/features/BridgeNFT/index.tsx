"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useConfig,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import mintXABIsepolia from "../../../config/abi/mintXsepolia.json";
import mintXABIfuji from "../../../config/abi/mintXfuji.json";
import { RingLoader } from "react-spinners";
import { ethers } from "ethers";
import RippleButton from "../../ui/Buttons/RippleButton";
import Dropdown from "../../ui/Dropdown";
import ProcessModal from "../../ui/ProcessModal";
import InfoIcon from "../../ui/Icons/InfoIcon";
import Alert from "../../ui/Alert";
import { getErrorMessage } from "../../../utils/errorHandler";
import { getIPFSUrl } from "@/utils/ipfs";

interface MessagingFee {
  nativeFee: bigint;
  lzTokenFee: bigint;
}

interface StoredURI {
  tokenId: string;
  uri: string;
  sourceChain: number;
  destinationChain: number;
  timestamp: number;
}

const BridgeNFT: React.FC = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isBridging, setIsBridging] = useState(false);
  const [isRestoringURI, setIsRestoringURI] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgingSteps, setBridgingSteps] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      status: "pending" | "loading" | "completed" | "error";
    }>
  >([
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
  const [currentBridgingStep, setCurrentBridgingStep] = useState<string | null>(
    null
  );
  const [bridgingModalError, setBridgingModalError] = useState<string | null>(
    null
  );
  const [nfts, setNfts] = useState<
    {
      value: string;
      label: string;
      hasURI: boolean;
      imageUrl?: string;
      metadata?: any;
    }[]
  >([]);
  const [targetChainOptions, setTargetChainOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedTargetChain, setSelectedTargetChain] = useState<number | null>(
    null
  );
  const [pendingURIs, setPendingURIs] = useState<StoredURI[]>([]);

  const sepoliaCA = process.env.NEXT_PUBLIC_SEPOLIA_CA! as `0x${string}`;
  const fujiCA = process.env.NEXT_PUBLIC_FUJI_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;
  const mxABIfuji = mintXABIfuji.abi;

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const filterCurrentNetwork = () => {
    if (chainId === 11155111) {
      return { eid: 40106 };
    } else if (chainId === 43113) {
      return { eid: 40161 };
    } else {
      throw new Error("Unsupported network");
    }
  };

  const updateTargetChainOptions = () => {
    if (chainId === 11155111) {
      setTargetChainOptions([{ value: 43113, label: "Fuji" }]);
    } else if (chainId === 43113) {
      setTargetChainOptions([{ value: 11155111, label: "Sepolia" }]);
    } else {
      setTargetChainOptions([]);
    }
  };

  // Load pending URIs from localStorage
  const loadPendingURIs = useCallback(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingBridgeURIs");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Filter for current chain and address
          const relevant = parsed.filter(
            (item: StoredURI) =>
              item.destinationChain === chainId &&
              item.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days
          );
          setPendingURIs(relevant);
        } catch (error) {
          console.error("Error loading pending URIs:", error);
        }
      }
    }
  }, [chainId]);

  // Save URI to localStorage before bridging
  const saveURIForBridge = (
    tokenId: string,
    uri: string,
    destinationChain: number
  ) => {
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
  };

  // Remove URI from localStorage after restoration
  const removeStoredURI = (tokenId: string) => {
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
          loadPendingURIs(); // Refresh the state
        } catch (error) {
          console.error("Error removing stored URI:", error);
        }
      }
    }
  };

  useEffect(() => {
    updateTargetChainOptions();
    loadPendingURIs();
  }, [chainId, loadPendingURIs]);

  const fetchNFTs = useCallback(async () => {
    if (isConnected && address) {
      try {
        console.log("=== FETCHING NFTs ===");
        console.log("Chain ID:", chainId);
        console.log("User address:", address);

        const minimalERC721ABI = [
          {
            inputs: [
              { internalType: "address", name: "owner", type: "address" },
            ],
            name: "balanceOf",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "owner", type: "address" },
              { internalType: "uint256", name: "index", type: "uint256" },
            ],
            name: "tokenOfOwnerByIndex",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "uint256", name: "tokenId", type: "uint256" },
            ],
            name: "tokenURI",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
        ];

        const nftOptions: {
          value: string;
          label: string;
          hasURI: boolean;
          imageUrl?: string;
          metadata?: any;
        }[] = [];
        let currentCA;

        if (chainId === 11155111) {
          currentCA = sepoliaCA;
        } else if (chainId === 43113) {
          currentCA = fujiCA;
        } else {
          setBridgeError("Unsupported network");
          return;
        }

        // Check if contract exists
        const code = await publicClient?.getBytecode({ address: currentCA });
        if (!code || code === "0x") {
          setBridgeError("Contract not found at the specified address");
          return;
        }

        const nftCount = (await publicClient?.readContract({
          address: currentCA,
          abi: minimalERC721ABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;

        console.log("NFT count:", nftCount.toString());

        if (Number(nftCount) === 0) {
          setNfts([]);
          return;
        }

        for (let i = 0; i < Number(nftCount); i++) {
          try {
            const tokenId = (await publicClient?.readContract({
              address: currentCA,
              abi: minimalERC721ABI,
              functionName: "tokenOfOwnerByIndex",
              args: [address, BigInt(i)],
            })) as bigint;

            const tokenURI = (await publicClient?.readContract({
              address: currentCA,
              abi: minimalERC721ABI,
              functionName: "tokenURI",
              args: [tokenId],
            })) as string;

            const hasURI: boolean = Boolean(tokenURI && tokenURI.length > 0);
            let nftName = `Token #${tokenId.toString()}`;
            let imageUrl = undefined;
            let metadata = undefined;

            if (hasURI) {
              try {
                const resolvedTokenURI = getIPFSUrl(tokenURI);

                const response = await fetch(resolvedTokenURI);
                if (response.ok) {
                  metadata = await response.json();
                  nftName = metadata.name || nftName;

                  // Get image URL
                  if (metadata.image) {
                    imageUrl = getIPFSUrl(metadata.image);
                  }
                }
              } catch (fetchError) {
                console.error("Error fetching metadata:", fetchError);
              }
            }

            nftOptions.push({
              value: tokenId.toString(),
              label: nftName,
              hasURI,
              imageUrl,
              metadata,
            });
          } catch (tokenError) {
            console.error(`Error fetching token at index ${i}:`, tokenError);
          }
        }

        setNfts(nftOptions);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setBridgeError(`Failed to fetch NFTs: ${error}`);
      }
    }
  }, [isConnected, address, publicClient, chainId, sepoliaCA, fujiCA]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  // Get selected NFT details
  const getSelectedNFT = () => {
    if (!selectedTokenId) return null;
    return nfts.find((nft) => nft.value === selectedTokenId.toString());
  };

  const selectedNFT = getSelectedNFT();

  const getContractDetails = () => {
    if (chainId === 11155111) {
      return { address: sepoliaCA, abi: mxABIsepolia };
    } else if (chainId === 43113) {
      return { address: fujiCA, abi: mxABIfuji };
    } else {
      throw new Error("Unsupported network");
    }
  };

  // Helper function to update step status
  const updateBridgingStep = (
    stepId: string,
    status: "pending" | "loading" | "completed" | "error"
  ) => {
    setBridgingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  // Helper function to reset all steps to pending
  const resetBridgingSteps = () => {
    setBridgingSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as const }))
    );
    setCurrentBridgingStep(null);
    setBridgingModalError(null);
  };

  const handleCloseBridgeModal = () => {
    setShowBridgeModal(false);
    if (bridgingModalError) {
      setIsBridging(false);
      setCurrentBridgingStep(null);
    }
  };

  const handleBridgeNFT = async () => {
    if (
      !isConnected ||
      selectedTokenId === null ||
      selectedTargetChain === null
    ) {
      setBridgeError(
        "Please connect your wallet, select a token, and choose a target chain."
      );
      return;
    }

    setIsBridging(true);
    setBridgeError(null);
    setShowBridgeModal(true);
    resetBridgingSteps();
    setBridgingModalError(null);

    try {
      const { address: contractAddress, abi } = getContractDetails();

      // Step 1: Capture the original URI before bridging
      setCurrentBridgingStep("capture");
      updateBridgingStep("capture", "loading");

      const originalURI = (await publicClient?.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getTokenURIForBridge",
        args: [selectedTokenId],
      })) as string;

      console.log("Original URI captured:", originalURI);

      // Step 2: Save URI for later restoration
      if (originalURI && originalURI.length > 0) {
        saveURIForBridge(
          selectedTokenId.toString(),
          originalURI,
          selectedTargetChain
        );
        console.log("URI saved for restoration");
      }

      // Step 3: Proceed with normal bridging
      const otherNetwork = filterCurrentNetwork();
      console.log("Target chain EID:", otherNetwork.eid);

      const recipientAddressBytes32 = ethers.zeroPadValue(address!, 32);

      setBridgeStatus("Creating send parameters...");

      const sendParams = {
        dstEid: otherNetwork.eid,
        to: recipientAddressBytes32,
        tokenId: selectedTokenId,
        extraOptions: "0x",
        composeMsg: "0x",
        onftCmd: "0x",
      };

      setBridgeStatus("Estimating fees...");

      const quote = (await publicClient?.readContract({
        address: contractAddress,
        abi: abi,
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
        abi: abi,
        address: contractAddress,
        functionName: "approve",
        args: [contractAddress, selectedTokenId],
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
        abi: abi,
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
          setSelectedTokenId(null);
          setSelectedTargetChain(null);
          setBridgeStatus(null);
          fetchNFTs();
        }, 5000);
      }, 1000);
    } catch (error) {
      console.error("Error during bridging:", error);
      const errorMessage =
        error instanceof Error
          ? `Bridging failed: ${error.message}`
          : "Bridging failed: An unknown error occurred.";

      setBridgeError(errorMessage);
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

  const handleRestoreURI = async (tokenId: string) => {
    const pendingURI = pendingURIs.find((uri) => uri.tokenId === tokenId);
    if (!pendingURI) {
      setBridgeError("No URI found for this token");
      return;
    }

    setIsRestoringURI(true);
    setBridgeError(null);
    setBridgeStatus("Checking if token exists on destination chain...");

    try {
      const { address: contractAddress, abi } = getContractDetails();

      // First, check if the token exists on the destination chain
      let tokenExists = false;
      let attempts = 0;
      const maxAttempts = 20; // Check for up to 60 seconds (3 seconds * 20)

      while (!tokenExists && attempts < maxAttempts) {
        try {
          // Try to get the owner of the token
          const owner = await publicClient?.readContract({
            address: contractAddress,
            abi: abi,
            functionName: "ownerOf",
            args: [tokenId],
          });

          if (owner && owner !== "0x0000000000000000000000000000000000000000") {
            tokenExists = true;
            console.log(
              `Token ${tokenId} found on destination chain, owner: ${owner}`
            );
          }
        } catch (ownerError) {
          // Token doesn't exist yet, wait and try again
          console.log(
            `Token ${tokenId} not found yet, attempt ${
              attempts + 1
            }/${maxAttempts}`
          );
          setBridgeStatus(
            `Waiting for token to arrive... (${attempts + 1}/${maxAttempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
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
        abi: abi,
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
        fetchNFTs();
      }, 3000);
    } catch (error) {
      console.error("Error restoring URI:", error);
      setBridgeError(
        `Failed to restore metadata: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setBridgeStatus(null);
    } finally {
      setIsRestoringURI(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl my-8 px-4">
      {bridgeError && (
        <Alert
          type="error"
          title="Error"
          message={getErrorMessage(bridgeError)}
          className="mb-6"
        />
      )}

      {bridgeStatus && (
        <Alert type="success" message={bridgeStatus} className="mb-6" />
      )}

      {/* Pending URI Restoration Section */}
      {pendingURIs.length > 0 && (
        <div className="mb-8 bg-[#1A1A1A] rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-2xl font-light text-white tracking-tight mb-2">
              Complete Your Bridge
            </h3>
            <p className="text-sm text-gray-400 font-light">
              Your NFT has arrived! Click below to restore metadata.
            </p>
          </div>

          <div className="p-6 space-y-3">
            {pendingURIs.map((pendingURI) => (
              <div
                key={pendingURI.tokenId}
                className="bg-[#0D0D0D] rounded-2xl border border-white/10 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-base font-light text-white mb-1">
                      NFT #{pendingURI.tokenId}
                    </div>
                    <div className="text-xs text-gray-400 font-light">
                      Bridged from{" "}
                      {pendingURI.sourceChain === 11155111 ? "Sepolia" : "Fuji"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#FF10F0] rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400 font-light">
                      Ready
                    </span>
                  </div>
                </div>

                <RippleButton
                  text={isRestoringURI ? "Restoring..." : "Restore Metadata"}
                  onClick={() => handleRestoreURI(pendingURI.tokenId)}
                  disabled={isRestoringURI}
                  className="w-full text-sm font-light py-2.5"
                  active
                />
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            <div className="p-4 bg-[#0D0D0D] rounded-2xl border border-white/10">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div className="text-xs text-gray-400 font-light leading-relaxed">
                  <span className="text-white font-normal">Note:</span> Bridging
                  takes 1-5 minutes. If the restore button doesn't work
                  immediately, please wait a moment and try again.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - NFT Selection & Preview */}
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
              onChange={(value) => setSelectedTokenId(Number(value))}
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

        {/* Right Column - Bridge Details */}
        <div className="space-y-6">
          <h2 className="text-3xl font-light text-white tracking-tight">
            Bridge Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-light">
                NFT Name
              </label>
              <input
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                type="text"
                value={selectedNFT?.label || ""}
                disabled
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-light">
                Token ID
              </label>
              <input
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                type="text"
                value={selectedNFT?.value || ""}
                disabled
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-light">
                Target Chain
              </label>
              <Dropdown
                options={targetChainOptions}
                value={selectedTargetChain}
                onChange={(value) => setSelectedTargetChain(Number(value))}
                placeholder="Choose destination chain..."
                disabled={isBridging}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <label className="text-xs text-gray-400 mb-2 block font-light">
              Important Information
            </label>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-[#FF10F0] mt-0.5 text-xs">•</span>
                <span className="text-gray-400 text-xs leading-relaxed font-light">
                  NFT metadata is captured automatically before bridging
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-[#FF10F0] mt-0.5 text-xs">•</span>
                <span className="text-gray-400 text-xs leading-relaxed font-light">
                  After bridging, switch to the destination chain
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-[#FF10F0] mt-0.5 text-xs">•</span>
                <span className="text-gray-400 text-xs leading-relaxed font-light">
                  Use the "Restore Metadata" button to complete the process
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-[#FF10F0] mt-0.5 text-xs">•</span>
                <span className="text-gray-400 text-xs leading-relaxed font-light">
                  The process may take a few minutes to complete
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <RippleButton
              text={isBridging ? "Bridging..." : "Bridge NFT"}
              onClick={handleBridgeNFT}
              disabled={isBridging || !selectedTokenId || !selectedTargetChain}
              className="w-full text-sm font-light py-2.5"
              active
            />
            {isBridging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
                <div className="flex items-center space-x-3">
                  <RingLoader color="#FF10F0" size={24} />
                  <span className="text-white font-light">Processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bridging Modal */}
      <ProcessModal
        isOpen={showBridgeModal}
        steps={bridgingSteps}
        currentStep={currentBridgingStep}
        error={bridgingModalError}
        onClose={bridgingModalError ? handleCloseBridgeModal : undefined}
        title="Bridging Your NFT"
        subtitle="This will take a moment..."
      />
    </div>
  );
};

export default BridgeNFT;
