"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import mintXABIsepolia from "../../config/abi/mintXsepolia.json";
import mintXABIfuji from "../../config/abi/mintXfuji.json";
import { useFetchNFTs } from "@/hooks/useFetchNFTs";
import { useBridgeNFT } from "@/hooks/useBridgeNFT";
import NFTSelector from "./_components/NFTSelector";
import BridgeForm from "./_components/BridgeForm";
import MetadataRestoreCard from "./_components/MetadataRestoreCard";
import ProcessModal from "@/components/ui/ProcessModal";
import Alert from "@/components/ui/Alert";
import { getErrorMessage } from "@/utils/errorHandler";

interface StoredURI {
  tokenId: string;
  uri: string;
  sourceChain: number;
  destinationChain: number;
  timestamp: number;
}

const BridgePage: React.FC = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  // Contract addresses
  const sepoliaCA = process.env.NEXT_PUBLIC_SEPOLIA_CA! as `0x${string}`;
  const fujiCA = process.env.NEXT_PUBLIC_FUJI_CA! as `0x${string}`;
  const mxABIsepolia = mintXABIsepolia.abi;
  const mxABIfuji = mintXABIfuji.abi;

  // State
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [selectedTargetChain, setSelectedTargetChain] = useState<number | null>(null);
  const [targetChainOptions, setTargetChainOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [pendingURIs, setPendingURIs] = useState<StoredURI[]>([]);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // Get contract details based on current chain
  const getContractDetails = () => {
    if (chainId === 11155111) {
      return { address: sepoliaCA, abi: mxABIsepolia };
    } else if (chainId === 43113) {
      return { address: fujiCA, abi: mxABIfuji };
    }
    // Return default values when wallet not connected or unsupported chain
    return { address: sepoliaCA, abi: mxABIsepolia };
  };

  const { address: contractAddress, abi: contractABI } = getContractDetails();

  // Fetch NFTs
  const { nfts, error: fetchError, isLoading: isLoadingNFTs, refetch } = useFetchNFTs({
    isConnected,
    address,
    chainId,
    contractAddress,
    contractABI,
  });

  // Bridge logic
  const {
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
  } = useBridgeNFT({
    chainId,
    address,
    contractAddress,
    contractABI,
    onSuccess: () => {
      setSelectedTokenId(null);
      setSelectedTargetChain(null);
      refetch();
    },
  });

  // Update target chain options based on current chain
  const updateTargetChainOptions = useCallback(() => {
    if (chainId === 11155111) {
      setTargetChainOptions([{ value: 43113, label: "Fuji" }]);
    } else if (chainId === 43113) {
      setTargetChainOptions([{ value: 11155111, label: "Sepolia" }]);
    } else {
      setTargetChainOptions([]);
    }
  }, [chainId]);

  // Load pending URIs from localStorage
  const loadPendingURIs = useCallback(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingBridgeURIs");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const relevant = parsed.filter(
            (item: StoredURI) =>
              item.destinationChain === chainId &&
              item.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
          );
          setPendingURIs(relevant);
        } catch (error) {
          console.error("Error loading pending URIs:", error);
        }
      }
    }
  }, [chainId]);

  useEffect(() => {
    updateTargetChainOptions();
    loadPendingURIs();
  }, [chainId, updateTargetChainOptions, loadPendingURIs]);

  // Get selected NFT details
  const selectedNFT = selectedTokenId
    ? nfts.find((nft) => nft.value === selectedTokenId.toString())
    : null;

  // Handlers
  const handleBridge = async () => {
    if (selectedTokenId === null || selectedTargetChain === null) {
      setBridgeError(
        "Please select a token and choose a target chain."
      );
      return;
    }

    setBridgeError(null);
    try {
      await handleBridgeNFT(selectedTokenId, selectedTargetChain);
    } catch (error) {
      setBridgeError(getErrorMessage(error));
    }
  };

  const handleRestore = async (tokenId: string) => {
    const pendingURI = pendingURIs.find((uri) => uri.tokenId === tokenId);
    if (!pendingURI) {
      setBridgeError("No URI found for this token");
      return;
    }

    setBridgeError(null);
    try {
      await handleRestoreURI(tokenId, pendingURI);
      loadPendingURIs();
    } catch (error) {
      setBridgeError(`Failed to restore metadata: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl my-8 px-4 md:px-8 lg:px-12 pb-8">
      <h2 className="text-3xl font-light text-white tracking-tight mb-8">
        Bridge Your NFTs
      </h2>

      {!isConnected ? (
        <p className="text-center text-white text-base font-light">
          Please connect your wallet to bridge your NFTs.
        </p>
      ) : (
        <>
          {fetchError && (
            <Alert
              type="error"
              title="Failed to load NFTs"
              message={getErrorMessage(fetchError)}
              className="mb-6"
            />
          )}

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
          <MetadataRestoreCard
            pendingURIs={pendingURIs}
            isRestoringURI={isRestoringURI}
            onRestoreURI={handleRestore}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - NFT Selection & Preview */}
            <NFTSelector
              nfts={nfts}
              selectedTokenId={selectedTokenId}
              onSelectToken={setSelectedTokenId}
              isBridging={isBridging}
              isLoading={isLoadingNFTs}
            />

            {/* Right Column - Bridge Details */}
            <BridgeForm
              selectedNFT={selectedNFT || null}
              selectedTargetChain={selectedTargetChain}
              targetChainOptions={targetChainOptions}
              onSelectTargetChain={setSelectedTargetChain}
              isConnected={isConnected}
              isBridging={isBridging}
              onBridge={handleBridge}
            />
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
        </>
      )}
    </div>
  );
};

export default BridgePage;
