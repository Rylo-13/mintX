import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode.react"; // Default import
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import styles from "./index.module.css";
import axios from "axios";
import OpenSeaIcon from "../Icons/OpenseaIcon";

interface NFTCardProps {
  imageUrl: string;
  nftName: string;
  nftDescription: string;
  attributes: { key: string; value: string }[];
  transactionHash: string;
}

const NFTCard: React.FC<NFTCardProps> = ({
  imageUrl,
  nftName,
  nftDescription,
  attributes,
  transactionHash,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [cursorStyle, setCursorStyle] = useState("pointer");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const initialRotation = { x: 0, y: 0, z: 0 };
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    if (qrCodeUrl) return;

    const uploadImageToPinata = async (image: string) => {
      const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
      const formData = new FormData();
      const blob = await fetch(image).then((res) => res.blob());

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

      try {
        const response = await axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
          },
        });
        const ipfsHash = response.data.IpfsHash;
        setQrCodeUrl(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      } catch (error) {
        console.error("Error uploading to Pinata:", error);
      }
    };

    const generateScreenshot = async () => {
      if (frontRef.current) {
        try {
          const dataUrl = await toPng(frontRef.current);
          await uploadImageToPinata(dataUrl);
        } catch (error) {
          console.error("Error generating screenshot:", error);
        }
      }
    };

    generateScreenshot();
  }, [qrCodeUrl, imageUrl]);

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
    if (!isDragging.current) {
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
          {/* <OpenSeaIcon /> */}
          <h3 className={styles.title}>{nftName}</h3>
          <img src={imageUrl} alt={nftName} className={styles.image} />
          <p className={styles.description}>{nftDescription}</p>
          <div className={styles.attributes}>
            {attributes.map((attr, index) => (
              <span key={index} className={styles.attribute}>
                {attr.key}: {attr.value}
              </span>
            ))}
          </div>
        </div>

        {/* Back Side */}
        <div className={`${styles.cardSide} ${styles.cardBack}`}>
          {qrCodeUrl && <QRCode value={qrCodeUrl} size={200} />}
          <p className={styles.transactionHash}>
            TX: {transactionHash.slice(0, 10)}...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NFTCard;
