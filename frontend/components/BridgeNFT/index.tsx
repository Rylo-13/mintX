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
import { TestnetV2EndpointId } from "@layerzerolabs/lz-definitions";
import { ChainId } from "@layerzerolabs/lz-sdk";

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

  const sepoliaCA = process.env.SEPOLIA_CA! as `0x${string}`;
  const fujiCA = process.env.FUJI_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;
  const mxABIfuji = mintXABIfuji.abi;

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

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
          return;
        }

        nftCount = (await publicClient?.readContract({
          address: currentCA,
          abi: currentABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;

        for (let i = 0; i < Number(nftCount); i++) {
          const tokenId = (await publicClient?.readContract({
            address: currentCA,
            abi: currentABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          })) as bigint;

          const tokenURI = (await publicClient?.readContract({
            address: currentCA,
            abi: currentABI,
            functionName: "tokenURI",
            args: [tokenId],
          })) as string;

          let resolvedTokenURI = tokenURI;
          if (tokenURI.startsWith("ipfs://")) {
            resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          }

          const response = await fetch(resolvedTokenURI);
          const metadata = await response.json();

          nftOptions.push({
            value: tokenId.toString(),
            label: metadata.name,
          });
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
    if (!isConnected || selectedTokenId === null) {
      setBridgeError("Please connect your wallet and select a token.");
      return;
    }

    setIsBridging(true);
    setBridgeError(null);
    setBridgeStatus("Estimating fees...");

    try {
      const { address: contractAddress, abi } = getContractDetails();

      const recipientAddressBytes32 = ethers.hexlify(
        ethers.zeroPadValue(address as string, 32)
      );

      const endpointId = TestnetV2EndpointId.SEPOLIA_V2_TESTNET;

      const sendParam = {
        to: recipientAddressBytes32,
        tokenId: selectedTokenId,
        dstEid: endpointId,
      };

      console.log("sendParam:", sendParam);

      const msgFee = (await publicClient?.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "quoteSend",
        args: [sendParam, false],
      })) as MessagingFee | undefined;

      if (!msgFee) {
        throw new Error(
          "Failed to estimate fees: quoteSend returned undefined"
        );
      }

      console.log("msgFee:", msgFee);

      const approvalReceipt = await writeContractAsync({
        abi: abi,
        address: contractAddress,
        functionName: "approve",
        args: [contractAddress, selectedTokenId],
      });

      await waitForTransactionReceipt(config, {
        hash: approvalReceipt,
        confirmations: 1,
      });

      const txResponse = await writeContractAsync({
        abi: abi,
        address: contractAddress,
        functionName: "send",
        args: [
          {
            ...sendParam,
            extraOptions: [],
          },
          { gasLimit: 1000000 },
        ],
        value: msgFee.nativeFee,
      });

      const receipt = await waitForTransactionReceipt(config, {
        hash: txResponse,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed");
      }

      setBridgeStatus("Bridging successful!");
    } catch (err) {
      console.error("Error bridging NFT:", err);
      setBridgeError(`Failed to bridge NFT. Error: ${err}`);
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl my-4 p-3">
      <h2 className="text-xl font-semibold mb-4">Bridge NFT</h2>
      <div className="mb-4">
        <label htmlFor="tokenId" className="block text-gray-700">
          Token ID
        </label>
        <input
          type="number"
          id="tokenId"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          value={selectedTokenId ?? ""}
          onChange={(e) => setSelectedTokenId(Number(e.target.value))}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="nftSelect" className="block text-gray-700">
          Select NFT
        </label>
        <select
          id="nftSelect"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          value={selectedTokenId ?? ""}
          onChange={(e) => setSelectedTokenId(Number(e.target.value))}
        >
          <option value="">Select an NFT</option>
          {nfts.map((nft) => (
            <option key={nft.value} value={nft.value}>
              {nft.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex space-x-4">
        {chainId === 11155111 && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handleBridgeNFT()} // Fuji chain ID
            disabled={isBridging}
          >
            Bridge to Fuji
          </button>
        )}
        {chainId === 43113 && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handleBridgeNFT()} // Sepolia chain ID
            disabled={isBridging}
          >
            Bridge to Sepolia
          </button>
        )}
      </div>
      {isBridging && (
        <div className="flex justify-center mt-4">
          <RingLoader color="#0070f3" size={60} />
        </div>
      )}
      {bridgeStatus && <p className="text-green-600 mt-4">{bridgeStatus}</p>}
      {bridgeError && <p className="text-red-600 mt-4">{bridgeError}</p>}
    </div>
  );
};

export default BridgeNFT;
