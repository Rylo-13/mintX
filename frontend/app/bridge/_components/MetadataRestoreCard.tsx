"use client";
import React from "react";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import InfoIcon from "@/components/ui/Icons/InfoIcon";

interface StoredURI {
  tokenId: string;
  uri: string;
  sourceChain: number;
  destinationChain: number;
  timestamp: number;
}

interface MetadataRestoreCardProps {
  pendingURIs: StoredURI[];
  isRestoringURI: boolean;
  onRestoreURI: (tokenId: string) => void;
}

const MetadataRestoreCard: React.FC<MetadataRestoreCardProps> = ({
  pendingURIs,
  isRestoringURI,
  onRestoreURI,
}) => {
  if (pendingURIs.length === 0) return null;

  return (
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
                <span className="text-xs text-gray-400 font-light">Ready</span>
              </div>
            </div>

            <RippleButton
              text={isRestoringURI ? "Restoring..." : "Restore Metadata"}
              onClick={() => onRestoreURI(pendingURI.tokenId)}
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
              takes 1-5 minutes. If the restore button doesn't work immediately,
              please wait a moment and try again.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataRestoreCard;
