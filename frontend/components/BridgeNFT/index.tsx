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
import mintXABIsepolia from "../../mintXsepolia.json";
import mintXABIfuji from "../../mintXfuji.json";
import { RingLoader } from "react-spinners";
import { ethers } from "ethers";
import RippleButton from "../Buttons/RippleButton";

interface MessagingFee {
  nativeFee: bigint;
  lzTokenFee: bigint;
}

const BridgeNFT: React.FC = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
  const [nfts, setNfts] = useState<{ value: string; label: string }[]>([]);
  const [targetChainOptions, setTargetChainOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedTargetChain, setSelectedTargetChain] = useState<number | null>(
    null
  );

  const sepoliaCA = process.env.SEPOLIA_CA! as `0x${string}`;
  const fujiCA = process.env.FUJI_CA! as `0x${string}`;
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
      // Connected to Sepolia, show only Fuji as target
      setTargetChainOptions([{ value: 43113, label: "Fuji" }]);
    } else if (chainId === 43113) {
      // Connected to Fuji, show only Sepolia as target
      setTargetChainOptions([{ value: 11155111, label: "Sepolia" }]);
    } else {
      setTargetChainOptions([]);
    }
  };

  useEffect(() => {
    updateTargetChainOptions();
  }, [chainId]);

  const fetchNFTs = useCallback(async () => {
    if (isConnected && address) {
      try {
        const nftOptions: { value: string; label: string }[] = [];
        let nftCount;
        let currentABI;
        let currentCA;

        if (chainId === 11155111) {
          // Sepolia
          currentABI = mxABIsepolia;
          currentCA = sepoliaCA;
        } else if (chainId === 43113) {
          // Fuji
          currentABI = mxABIfuji;
          currentCA = fujiCA;
        } else {
          setBridgeError("Unsupported network");
          console.error("Unsupported network", chainId);
          return;
        }

        nftCount = (await publicClient?.readContract({
          address: currentCA,
          abi: currentABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;

        console.log("NFT count:", nftCount.toString());

        for (let i = 0; i < Number(nftCount); i++) {
          const tokenId = (await publicClient?.readContract({
            address: currentCA,
            abi: currentABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          })) as bigint;

          console.log("Fetched tokenId:", tokenId.toString());

          const tokenURI = (await publicClient?.readContract({
            address: currentCA,
            abi: currentABI,
            functionName: "tokenURI",
            args: [tokenId],
          })) as string;

          if (!tokenURI) {
            console.error(
              `Token URI for tokenId ${tokenId.toString()} is empty.`
            );
          } else {
            console.log("Fetched tokenURI:", tokenURI);
          }

          let resolvedTokenURI = tokenURI;
          if (tokenURI.startsWith("ipfs://")) {
            resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          }

          try {
            const response = await fetch(resolvedTokenURI);

            if (!response.ok) {
              console.error(`HTTP error! Status: ${response.status}`);
              continue;
            }

            const metadata = await response.json();
            console.log("Fetched metadata:", metadata);

            nftOptions.push({
              value: tokenId.toString(),
              label: metadata.name,
            });
          } catch (fetchError) {
            console.error("Error fetching metadata:", fetchError);
            setBridgeError("Failed to fetch NFT metadata.");
          }
        }

        setNfts(nftOptions);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setBridgeError("Failed to fetch NFTs.");
      }
    }
  }, [isConnected, address, publicClient, chainId, sepoliaCA, fujiCA]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

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
      console.error(
        "Wallet not connected, token not selected, or target chain not selected"
      );
      return;
    }

    setIsBridging(true);
    setBridgeError(null);
    setBridgeStatus("Estimating fees...");

    try {
      const { address: contractAddress, abi } = getContractDetails();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log("Signer address:", await signer.getAddress());

      // Use the selected target chain
      const targetChainId = selectedTargetChain;
      const otherNetwork = filterCurrentNetwork();
      console.log("Target chain ID:", targetChainId);

      const recipientAddressBytes32 = ethers.zeroPadValue(signer.address, 32);

      const sendParams = [
        otherNetwork.eid,
        recipientAddressBytes32,
        selectedTokenId,
        "0x",
        "0x",
        "0x",
      ];

      console.log("sendParams:", sendParams);

      const quote = (await publicClient?.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "quoteSend",
        args: [sendParams, false],
      })) as MessagingFee | undefined;

      if (!quote) {
        throw new Error(
          "Failed to estimate fees: quoteSend returned undefined"
        );
      }

      console.log("quote:", quote);

      // Approving the NFT for transfer
      const approvalTx = await writeContractAsync({
        abi: abi,
        address: contractAddress,
        functionName: "approve",
        args: [contractAddress, selectedTokenId],
      });

      console.log("Approval transaction hash:", approvalTx);

      await waitForTransactionReceipt(config, {
        hash: approvalTx,
        confirmations: 2,
      });

      console.log("Approval transaction confirmed");

      // Sending the NFT across chains
      const sendTx = await writeContractAsync({
        abi: abi,
        address: contractAddress,
        functionName: "send",
        args: [sendParams, [quote.nativeFee, 0], signer.address],
        value: quote.nativeFee,
      });

      console.log("Send transaction hash:", sendTx);

      const receipt = await waitForTransactionReceipt(config, {
        hash: sendTx,
        confirmations: 2,
      });

      console.log("Send transaction receipt:", receipt);

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed");
      }

      setBridgeStatus("Bridging successful!");
    } catch (error) {
      console.error("Error bridging NFT:", error);
      setBridgeError("Failed to bridge NFT.");
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl mt-10 p-3 relative">
      {isBridging && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#101010] bg-opacity-75 z-10">
          <RingLoader color="#fff" size={100} />
        </div>
      )}
      <div
        className={`border bg-[#101010] p-10 ${isBridging ? "opacity-50" : ""}`}
      >
        <div className="mb-6">
          <label
            htmlFor="targetChain"
            className="block text-lg font-medium mb-2"
          >
            Select Target Chain
          </label>
          <div className="relative">
            <select
              id="targetChain"
              className="block w-full px-3 py-2 border rounded-lg text-white appearance-none"
              value={selectedTargetChain ?? ""}
              onChange={(e) => setSelectedTargetChain(Number(e.target.value))}
            >
              <option value="" className="text-gray-400">
                -- Select --
              </option>
              {targetChainOptions.map((chain) => (
                <option key={chain.value} value={chain.value}>
                  {chain.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.293 7.293a1 1 0 011.414 0L10 8.586l2.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="nftSelect" className="block text-lg font-medium mb-2">
            Select NFT
          </label>
          <div className="relative">
            <select
              id="nftSelect"
              className="block w-full px-3 py-2 border rounded-lg text-white appearance-none"
              value={selectedTokenId ?? ""}
              onChange={(e) => setSelectedTokenId(Number(e.target.value))}
            >
              <option value="" className="text-gray-400">
                -- Select --
              </option>
              {nfts.map((nft) => (
                <option key={nft.value} value={nft.value}>
                  {nft.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.293 7.293a1 1 0 011.414 0L10 8.586l2.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="tokenId" className="block text-lg font-medium mb-2">
            Token ID
          </label>
          <input
            type="number"
            id="tokenId"
            className="mb-2 w-full px-3 py-1.5 border bg-transparent"
            value={selectedTokenId ?? ""}
            disabled
            onChange={(e) => setSelectedTokenId(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <RippleButton
          text={isBridging ? "Bridging NFT" : "Bridge NFT"}
          onClick={handleBridgeNFT}
          disabled={isBridging || !selectedTokenId}
          className="w-64"
          active
        />
      </div>
      {bridgeError && (
        <div className="mt-6 text-center text-red-500">
          <p>{bridgeError}</p>
        </div>
      )}
      {bridgeStatus && (
        <div className="mt-4 text-center text-green-500">
          <p>{bridgeStatus}</p>
        </div>
      )}
    </div>
  );
};

export default BridgeNFT;
