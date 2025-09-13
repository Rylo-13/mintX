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
import mintXABIsepolia from "../../config/abi/mintXsepolia.json";
import mintXABIfuji from "../../config/abi/mintXfuji.json";
import { RingLoader } from "react-spinners";
import { ethers } from "ethers";
import RippleButton from "../Buttons/RippleButton";

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

            const hasURI = tokenURI && tokenURI.length > 0;
            let nftName = `Token #${tokenId.toString()}`;
            let imageUrl = undefined;
            let metadata = undefined;

            if (hasURI) {
              try {
                let resolvedTokenURI = tokenURI;
                if (tokenURI.startsWith("ipfs://")) {
                  resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(
                    7
                  )}`;
                }

                const response = await fetch(resolvedTokenURI);
                if (response.ok) {
                  metadata = await response.json();
                  nftName = metadata.name || nftName;

                  // Get image URL
                  if (metadata.image) {
                    imageUrl = metadata.image.startsWith("ipfs://")
                      ? `https://ipfs.io/ipfs/${metadata.image.substring(7)}`
                      : metadata.image;
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
    setBridgeStatus("Preparing bridge transaction...");

    try {
      const { address: contractAddress, abi } = getContractDetails();

      // Step 1: Capture the original URI before bridging
      setBridgeStatus("Capturing NFT metadata...");

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

      setBridgeStatus("Approving NFT for transfer...");

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

      setBridgeStatus("Sending NFT across chains...");

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

      setBridgeStatus("Waiting for confirmation...");

      await waitForTransactionReceipt(config, {
        hash: sendTx,
        confirmations: 2,
      });

      setBridgeStatus(
        "NFT successfully bridged! 🎉 Switch to the destination chain to restore metadata."
      );

      // Clear selections after bridging
      setTimeout(() => {
        setSelectedTokenId(null);
        setSelectedTargetChain(null);
        setBridgeStatus(null);
        fetchNFTs();
      }, 5000);
    } catch (error) {
      console.error("Error during bridging:", error);
      if (error instanceof Error) {
        setBridgeError(`Bridging failed: ${error.message}`);
      } else {
        setBridgeError("Bridging failed: An unknown error occurred.");
      }
      setBridgeStatus(null);
    } finally {
      setIsBridging(false);
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
    <div className="container mx-auto max-w-xl my-4 p-3">
      <div className="border bg-[#101010] p-10 rounded-lg">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Bridge Your NFT
        </h2>

        {bridgeError && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 rounded-lg mb-6 border border-red-700">
            <div className="flex items-center">
              <span className="text-red-300 mr-2">⚠️</span>
              {bridgeError}
            </div>
          </div>
        )}

        {bridgeStatus && (
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 rounded-lg mb-6 border border-blue-700">
            <div className="flex items-center">
              <span className="text-blue-300 mr-2">ℹ️</span>
              {bridgeStatus}
            </div>
          </div>
        )}

        {/* Pending URI Restoration Section */}
        {pendingURIs.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 text-white p-6 rounded-lg mb-6 border border-yellow-700">
            <h3 className="font-bold mb-3 text-xl flex items-center">
              <span className="mr-2">🔄</span>
              NFTs Awaiting Metadata Restoration
            </h3>
            <p className="text-yellow-100 text-sm mb-4 leading-relaxed">
              These NFTs were bridged but need their metadata restored. Make
              sure the tokens have arrived on this chain first!
            </p>
            <div className="space-y-3">
              {pendingURIs.map((pendingURI) => (
                <div
                  key={pendingURI.tokenId}
                  className="flex items-center justify-between bg-yellow-800/50 backdrop-blur-sm p-4 rounded-lg border border-yellow-600/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      Token #{pendingURI.tokenId}
                    </span>
                    <span className="text-xs text-yellow-200 flex items-center mt-1">
                      <span className="mr-1">📍</span>
                      From:{" "}
                      {pendingURI.sourceChain === 11155111 ? "Sepolia" : "Fuji"}
                    </span>
                  </div>
                  <RippleButton
                    text={isRestoringURI ? "Checking..." : "Restore Metadata"}
                    onClick={() => handleRestoreURI(pendingURI.tokenId)}
                    disabled={isRestoringURI}
                    className="text-sm px-4 py-2"
                    active
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-800/30 rounded-lg border border-yellow-600/30">
              <p className="text-xs text-yellow-100 flex items-center">
                <span className="mr-2">💡</span>
                <strong className="mr-1">Tip:</strong> LayerZero bridging takes
                1-5 minutes. If restore fails, wait a bit longer and try again.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-white text-sm font-semibold mb-3 uppercase tracking-wide">
              Select NFT to Bridge
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white appearance-none cursor-pointer hover:border-[#D600C4] focus:border-[#D600C4] focus:outline-none focus:ring-2 focus:ring-[#D600C4]/20 transition-all duration-200"
                value={selectedTokenId || ""}
                onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                disabled={isBridging}
              >
                <option value="" disabled>
                  {nfts.length === 0 ? "No NFTs available" : "Choose an NFT..."}
                </option>
                {nfts.map((nft) => (
                  <option
                    key={nft.value}
                    value={nft.value}
                    className="bg-gray-800"
                  >
                    {nft.label} (ID: {nft.value}){" "}
                    {!nft.hasURI ? " ⚠️ No Metadata" : ""}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Selected NFT Preview */}
          {selectedNFT && selectedNFT.imageUrl && (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6 shadow-2xl">
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide flex items-center">
                <span className="mr-2">🖼️</span>
                Selected NFT Preview
              </h3>
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#D600C4] to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative w-32 h-32 bg-black rounded-xl overflow-hidden">
                      <img
                        src={selectedNFT.imageUrl}
                        alt={selectedNFT.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-[#D600C4] text-sm font-medium bg-[#D600C4]/10 px-3 py-1 rounded-full border border-[#D600C4]/20">
                      Token ID: {selectedNFT.value}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center lg:text-left">
                  <h4 className="text-white font-bold text-xl mb-3 truncate">
                    {selectedNFT.label}
                  </h4>
                  {selectedNFT.metadata?.description && (
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {selectedNFT.metadata.description}
                    </p>
                  )}
                  {selectedNFT.metadata?.attributes &&
                    selectedNFT.metadata.attributes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                          Attributes
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                          {selectedNFT.metadata.attributes
                            .slice(0, 3)
                            .map((attr: any, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center bg-gradient-to-r from-[#D600C4] to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg"
                              >
                                {attr.key || attr.trait_type}: {attr.value}
                              </span>
                            ))}
                          {selectedNFT.metadata.attributes.length > 3 && (
                            <span className="inline-flex items-center bg-gray-700/50 backdrop-blur-sm text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-600/50">
                              +{selectedNFT.metadata.attributes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-semibold mb-3 uppercase tracking-wide">
              Select Target Chain
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white appearance-none cursor-pointer hover:border-[#D600C4] focus:border-[#D600C4] focus:outline-none focus:ring-2 focus:ring-[#D600C4]/20 transition-all duration-200"
                value={selectedTargetChain || ""}
                onChange={(e) => setSelectedTargetChain(Number(e.target.value))}
                disabled={isBridging}
              >
                <option value="" disabled>
                  Choose destination chain...
                </option>
                {targetChainOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-gray-800"
                  >
                    🌐 {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative">
            <RippleButton
              text={isBridging ? "Bridging..." : "Bridge NFT"}
              onClick={handleBridgeNFT}
              disabled={isBridging || !selectedTokenId || !selectedTargetChain}
              className="w-full py-4 text-lg font-semibold"
              active
            />
            {isBridging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                <div className="flex items-center space-x-3">
                  <RingLoader color="#D600C4" size={24} />
                  <span className="text-white font-medium">Processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <span className="mr-2">📋</span>
            Bridge Information
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start space-x-3">
              <span className="text-[#D600C4] mt-0.5">🔄</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                NFT metadata is captured automatically before bridging
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#D600C4] mt-0.5">🔀</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                After bridging, switch to the destination chain
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#D600C4] mt-0.5">🔧</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                Use the "Restore Metadata" button to complete the process
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#D600C4] mt-0.5">💰</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                Bridge fees are paid in the native token of the source chain
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-[#D600C4] mt-0.5">⏱️</span>
              <span className="text-gray-300 text-sm leading-relaxed">
                The process may take a few minutes to complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeNFT;
