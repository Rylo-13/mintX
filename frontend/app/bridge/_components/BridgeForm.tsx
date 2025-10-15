"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import Dropdown from "@/components/ui/Dropdown";
import { RingLoader } from "react-spinners";

interface NFTOption {
  value: string;
  label: string;
  hasURI: boolean;
  imageUrl?: string;
  metadata?: any;
}

interface BridgeFormProps {
  selectedNFT: NFTOption | null;
  selectedTargetChain: number | null;
  targetChainOptions: { value: number; label: string }[];
  onSelectTargetChain: (chainId: number) => void;
  isConnected: boolean;
  isBridging: boolean;
  onBridge: () => void;
}

const BridgeForm: React.FC<BridgeFormProps> = ({
  selectedNFT,
  selectedTargetChain,
  targetChainOptions,
  onSelectTargetChain,
  isConnected,
  isBridging,
  onBridge,
}) => {
  return (
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
            onChange={(value) => onSelectTargetChain(Number(value))}
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
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <RippleButton
              text={
                !isConnected
                  ? "Connect Wallet"
                  : isBridging
                  ? "Bridging..."
                  : "Bridge NFT"
              }
              onClick={!isConnected ? openConnectModal : onBridge}
              disabled={
                isConnected &&
                (isBridging || !selectedNFT || !selectedTargetChain)
              }
              className="w-full text-sm font-light py-2.5"
              active
            />
          )}
        </ConnectButton.Custom>
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
  );
};

export default BridgeForm;
