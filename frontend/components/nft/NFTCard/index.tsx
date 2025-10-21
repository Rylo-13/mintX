"use client";
import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode.react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import styles from "./index.module.css";
import axios from "axios";
import { RingLoader } from "react-spinners";

import Image from "next/image";
import RaribleIcon from "@/components/ui/Icons/RaribleIcon";
import JoepegsIcon from "@/components/ui/Icons/JoepegsIcon";
import EthereumIcon from "@/components/ui/Icons/EthereumIcon";
import AvalancheIcon from "@/components/ui/Icons/AvalancheIcon";
import { getIPFSUrl } from "@/utils/ipfs";

interface NFTCardProps {
  imageUrl: string;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  transactionHash?: string;
  contractAddress?: string;
  tokenId?: string;
  chainId?: number;
  onImageLoad?: () => void;
  isPreview?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({
  imageUrl,
  nftName,
  nftDescription,
  attributes,
  transactionHash,
  contractAddress,
  tokenId,
  chainId,
  onImageLoad,
  isPreview = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [cursorStyle, setCursorStyle] = useState("grabbing");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const initialRotation = { x: 0, y: 0, z: 0 };
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const decimalTokenId = tokenId ? BigInt(tokenId).toString(10) : "";

  const uploadImageToPinata = useRef(false);

  // Filter out empty attributes
  const filteredAttributes = attributes.filter(
    (attr) => attr.key.trim() !== "" && attr.value.trim() !== ""
  );

  useEffect(() => {
    if (isPreview || qrCodeUrl || uploadImageToPinata.current) return;

    const uploadImage = async (imageUrl: string) => {
      const formData = new FormData();

      try {
        const response = await axios.get(imageUrl, { responseType: "blob" });
        const blob = response.data;

        formData.append("file", blob, "nft_card_screenshot.png");

        const metadata = JSON.stringify({
          name: "NFT Card Screenshot",
          keyvalues: {
            description:
              "Screenshot of the NFT Card including metadata and image",
          },
        });
        formData.append("pinataMetadata", metadata);

        const options = JSON.stringify({
          cidVersion: 0,
        });
        formData.append("pinataOptions", options);

        const pinataResponse = await axios.post(
          "/api/pinScreenshotToIPFS",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const ipfsHash = pinataResponse.data.IpfsHash;
        setQrCodeUrl(getIPFSUrl(ipfsHash));
        uploadImageToPinata.current = true;
      } catch (error) {
        console.error("Error uploading to Pinata:", error);
      }
    };

    const generateScreenshot = async () => {
      if (frontRef.current) {
        try {
          const dataUrl = await toPng(frontRef.current);
          await uploadImage(dataUrl);
        } catch (error) {
          console.error("Error generating screenshot:", error);
        }
      }
    };

    generateScreenshot();
  }, [qrCodeUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    setCursorStyle("grabbing");
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setRotation((prev) => ({ ...prev, x: deltaY / 2, y: deltaX / 2 }));
    isDragging.current = true;
  };

  const handleMouseUp = (e: MouseEvent) => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    setCursorStyle("pointer");
    if (!isDragging.current && cardRef.current) {
      handleFlip(e);
    } else {
      isDragging.current = false;
    }
  };

  const handleFlip = (e: MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const flipType = getFlipType(clickX, clickY, rect.width, rect.height);

    if (rotation.x !== initialRotation.x || rotation.y !== initialRotation.y) {
      setRotation(initialRotation);
      setIsFlipped(false);
    } else {
      setRotation((prev) => {
        let newRotation = { ...prev };

        switch (flipType) {
          case "top":
            newRotation.x += 360;
            break;
          case "bottom":
            newRotation.x -= 360;
            break;
          case "left":
            newRotation.y -= 360;
            break;
          case "right":
            newRotation.y += 360;
            break;
          case "top-left":
            newRotation.x += 360;
            newRotation.y -= 360;
            break;
          case "top-right":
            newRotation.x += 360;
            newRotation.y += 360;
            break;
          case "bottom-left":
            newRotation.x -= 360;
            newRotation.y -= 360;
            break;
          case "bottom-right":
            newRotation.x -= 360;
            newRotation.y += 360;
            break;
          default:
            break;
        }

        return newRotation;
      });

      setIsFlipped(!isFlipped);
    }
  };

  const getFlipType = (
    clickX: number,
    clickY: number,
    width: number,
    height: number
  ):
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right" => {
    const threshold = 0.3;
    const horizontalRatio = clickX / width;
    const verticalRatio = clickY / height;

    if (verticalRatio < threshold && horizontalRatio < threshold)
      return "top-left";
    if (verticalRatio < threshold && horizontalRatio > 1 - threshold)
      return "top-right";
    if (verticalRatio > 1 - threshold && horizontalRatio < threshold)
      return "bottom-left";
    if (verticalRatio > 1 - threshold && horizontalRatio > 1 - threshold)
      return "bottom-right";
    if (verticalRatio < threshold) return "top";
    if (verticalRatio > 1 - threshold) return "bottom";
    if (horizontalRatio < threshold) return "left";
    if (horizontalRatio > 1 - threshold) return "right";

    return "top";
  };

  const getChainIcon = () => {
    // Sepolia (Ethereum testnet)
    if (chainId === 11155111) {
      return <EthereumIcon />;
    }
    // Fuji (Avalanche testnet)
    if (chainId === 43113) {
      return <AvalancheIcon />;
    }
    return null;
  };

  const getMarketplaceInfo = () => {
    // Sepolia (Ethereum testnet) - Use Rarible
    if (chainId === 11155111) {
      return {
        url: `https://testnet.rarible.com/token/${contractAddress}:${decimalTokenId}`,
        icon: <RaribleIcon />
      };
    }
    // Fuji (Avalanche testnet) - Use Joepegs
    if (chainId === 43113) {
      return {
        url: `https://fuji.joepegs.com/item/avalanche/${contractAddress}/${decimalTokenId}`,
        icon: <JoepegsIcon />
      };
    }
    // Default fallback to Rarible
    return {
      url: `https://testnet.rarible.com/token/${contractAddress}:${decimalTokenId}`,
      icon: <RaribleIcon />
    };
  };

  return (
    <div
      className={styles.cardContainer}
      onMouseDown={handleMouseDown}
      ref={cardRef}
      style={{ cursor: cursorStyle }}
    >
      <motion.div
        className={`${styles.card} ${isFlipped ? styles.flipped : ""}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
        transition={{ duration: 0.6 }}
      >
        {/* Front Side */}
        <div
          className={`${styles.cardSide} ${styles.cardFront}`}
          ref={frontRef}
        >
          <div className="absolute top-4 right-4 z-10">
            {getChainIcon()}
          </div>
          <h3 className={styles.title}>{nftName}</h3>
          <Image
            src={imageUrl}
            alt={nftName}
            className={styles.image}
            width={256}
            height={256}
            priority
            onLoad={onImageLoad}
          />
          <p className={styles.description}>{nftDescription}</p>
          {filteredAttributes.length > 0 && (
            <div className={styles.attributes}>
              {filteredAttributes.map((attr, index) => (
                <span key={index} className={styles.attribute}>
                  {attr.key}: {attr.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Back Side */}
        <div className={`${styles.cardSide} ${styles.cardBack}`}>
          {isPreview ? (
            <div className="text-gray-500 text-sm font-light">Preview</div>
          ) : (
            <>
              {qrCodeUrl ? (
                <QRCode value={qrCodeUrl} size={200} />
              ) : (
                <RingLoader color="#ffffff" size={130} />
              )}
              {transactionHash ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.transactionHash}
                >
                  TX: {transactionHash.slice(0, 16)}...
                </a>
              ) : (
                ""
              )}
              <>
                <a
                  href={getMarketplaceInfo().url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 cursor-pointer"
                >
                  {getMarketplaceInfo().icon}
                </a>
              </>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NFTCard;
