"use client";
import RippleButton from "@/components/Buttons/RippleButton";
import { useAccount, useWriteContract } from "wagmi";
import contractABI from "../../aiArtABI.json";
import DeleteIcon from "../Icons/DeleteIcon";
import React, { useState } from "react";
import { motion } from "framer-motion";
import AddIcon from "../Icons/AddIcon";
import axios from "axios";

const ImageUploader: React.FC = () => {
  const { isConnected } = useAccount();
  const [slectedImage, setSelectedImage] = useState<File | null>(null); // Holds the selected image file for upload or generation
  const [generatedImageUrl, setIsGeneratedImageUrl] = useState<string | null>(
    null
  ); // Stores the URL of the generated AI image
  const [aiImageDescription, setAiImageDescription] = useState(""); // Stores the description for generating AI image
  const [isMinting, setIsMinting] = useState(false); // Tracks whether the NFT minting process is ongoing
  const [isGenerating, setIsGenerating] = useState(false); // Tracks whether the AI image generation process is ongoing
  const [errors, setErrors] = useState(""); // Stores any errors that occur during image upload or interaction with the contract
  const [isCompleted, setIsCompleted] = useState(false); // Indicates if the NFT minting process is completed
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // Stores the URL of the uploaded image
  const [mintedNFTDetails, setMintedNFTDetails] = useState<any>(null); // Stores details of the minted NFT after successful mint
  const [isGenerated, setIsGenerated] = useState(false); // Tracks if an AI image has been generated
  const [mintedImageUrl, setMintedImageUrl] = useState<string | null>(null); // Stores the URL of the minted NFT image
  const [nftName, setNftName] = useState(""); // Stores the name of the NFT
  const [nftDescription, setNFTDescription] = useState(""); // Stores the description of the NFT
  const [isFlipped, setIsFlipped] = useState(false); // Tracks if the NFT display is flipped
  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >([{ key: "", value: "" }]); // Stores attributes (key-value pairs) associated with the NFT

  const contractAddress = "0xDdFCfb6C6dDA3eab52cA8FB78c94A6A973fA9De5";
  const abi = contractABI.abi;

  const { writeContractAsync } = useWriteContract();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      setSelectedImage(selectedFile);
      setUploadedImageUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setIsGeneratedImageUrl(null);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const handleDeleteAttribute = (index: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes.splice(index, 1);
    setAttributes(updatedAttributes);
  };

  const handleAttributeChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index][field] = value;
    setAttributes(updatedAttributes);
  };

  const resetFields = () => {
    setSelectedImage(null);
    setIsGeneratedImageUrl(null);
    setAiImageDescription("");
    setErrors("");
    setIsMinting(false);
    setIsGenerating(false);
    setIsGenerated(false);
    setUploadedImageUrl(null);
    setMintedNFTDetails(null);
    setMintedImageUrl(null);
    setNftName("");
    setNFTDescription("");
    setAttributes([{ key: "", value: "" }]);
    setIsCompleted(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMintNFT = async () => {
    if (!isConnected) {
      setErrors("Wallet is not connected.");
      return;
    }

    if (
      (!setSelectedImage && !generatedImageUrl) ||
      !nftName ||
      !nftDescription
    )
      return;

    setIsMinting(true);

    try {
      const imageBuffer = generatedImageUrl
        ? await (await fetch(generatedImageUrl)).arrayBuffer()
        : slectedImage
        ? await slectedImage.arrayBuffer()
        : null;

      if (!imageBuffer) {
        throw new Error("No image available for upload");
      }

      const formData = new FormData();
      formData.append("file", new Blob([imageBuffer]), "image.png");

      const pinataResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
          },
        }
      );

      const imageHash = pinataResponse.data.IpfsHash;
      const imageURI = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

      setUploadedImageUrl(imageURI);

      const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageURI,
        attributes,
      };

      const metadataResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
          },
        }
      );

      const metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;

      const data = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: "mintNFT",
        args: [metadataURI],
      });

      setMintedNFTDetails({
        nftName,
        nftDescription,
        image: imageURI,
        attributes,
        transactionHash: data,
      });

      setMintedImageUrl(isGenerated ? generatedImageUrl : imageURI);

      setIsCompleted(true);
      console.log("Transaction Hash:", data);
    } catch (err) {
      console.error("Error uploading image or interacting with contract:", err);
      setErrors(
        "Failed to upload image or interact with contract. Please try again."
      );
    } finally {
      setIsMinting(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImageDescription) return;

    setIsGenerating(true);

    try {
      const response = await axios.post(
        "api/generateImage",
        {
          aiImageDescription,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { imageUrl } = response.data;

      setIsGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error("Error generating images:", error);
      setErrors("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg p-4">
      {!isCompleted && (
        <div className="shadow-md rounded p-4">
          <div className="flex justify-between mb-4">
            <motion.button
              whileHover={{
                scale: 1.05,
                textShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
                boxShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
              }}
            >
              <RippleButton
                text="Upload Image"
                onClick={() => setIsGenerated(false)}
                active={!isGenerated}
              />
            </motion.button>
            <motion.button
              whileHover={{
                scale: 1.05,
                textShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
                boxShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
              }}
            >
              <RippleButton
                text="Create Image"
                onClick={() => setIsGenerated(true)}
                active={isGenerated}
              />
            </motion.button>
          </div>
          {!isGenerated && (
            <div className="mb-4">
              <input
                type="file"
                onChange={handleFileInputChange}
                className="mb-4 w-full p-2 border rounded"
              />
              {uploadedImageUrl && (
                <>
                  <motion.div
                    className="relative flex justify-center"
                    initial={{ y: -550 }}
                    animate={{ y: -10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <img
                      src={uploadedImageUrl}
                      alt="Selected"
                      className="mt-4 rounded shadow"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    <DeleteIcon
                      className="absolute h-8 w-8 cursor-pointer mt-2 mr-14 top-0 right-0"
                      onClick={handleClearImage}
                    />
                  </motion.div>
                </>
              )}
            </div>
          )}
          {isGenerated && (
            <div className="mb-4">
              <input
                className="mb-4 w-full p-2 border rounded"
                type="text"
                placeholder="AI Image Description"
                value={aiImageDescription}
                onChange={(e) => setAiImageDescription(e.target.value)}
              />
              <div className="flex justify-center">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    textShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
                    boxShadow: "0px, 0px, 10px, rgb(255, 255, 255)",
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  disabled={isGenerating}
                  onClick={handleGenerateImage}
                >
                  {isGenerating ? "Generating..." : "Generate AI Image"}
                </motion.button>
              </div>
              {generatedImageUrl && (
                <div className="relative flex justify-center">
                  <motion.div
                    className="relative flex justify-center"
                    initial={{ y: -550 }}
                    animate={{ y: -10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <img
                      src={generatedImageUrl}
                      alt="Generated Image"
                      className="mt-8 rounded shadow"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    <DeleteIcon
                      className="absolute h-8 w-8 cursor-pointer mt-2 mr-2 top-0 right-0"
                      onClick={handleClearImage}
                    />
                  </motion.div>
                </div>
              )}
            </div>
          )}
          {/* {(uploadedImage || generatedImageUrl) && ( */}
          <>
            <div className="mb-4">
              <input
                className="mb-2 w-full p-2 border rounded"
                type="text"
                placeholder="Name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
              />
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Description"
                value={nftDescription}
                onChange={(e) => setNFTDescription(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Attributes</h3>
              {attributes.map((attribute, index) => (
                <div key={index} className="flex mb-2">
                  <div className="flex w-full relative">
                    <input
                      className="w-1/2 p-2 border rounded"
                      type="text"
                      placeholder="Key"
                      value={attribute.key}
                      onChange={(e) =>
                        handleAttributeChange(index, "key", e.target.value)
                      }
                    />
                    <input
                      className="w-1/2 p-2 border rounded"
                      type="text"
                      placeholder="Value"
                      value={attribute.value}
                      onChange={(e) =>
                        handleAttributeChange(index, "value", e.target.value)
                      }
                    />
                    {index > 0 && (
                      <DeleteIcon
                        className="h-8 w-8 cursor-pointer absolute top-0 left-full mt-1.5 ml-1"
                        onClick={() => handleDeleteAttribute(index)}
                      />
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <AddIcon
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleAddAttribute}
                />
              </div>
            </div>
          </>
          {/* )} */}
          {/* {(uploadedImage || generatedImageUrl) &&
            nftName &&
            nftDescription &&
            attributes.length > 0 &&
            attributes.every((attr) => attr.key && attr.value) &&
            attributes.length > 0 && ( */}
          <RippleButton
            className="w-full"
            text={isMinting ? "Minting..." : "Mint NFT"}
            onClick={handleMintNFT}
            active
          />
          {/* )} */}
          {errors && <p className="text-red-500 mt-4">{errors}</p>}
        </div>
      )}
      {isCompleted && mintedNFTDetails && (
        <>
          <h2 className="flex justify-center mt-16 mb-10 text-3xl font-semibold text-white">
            NFT Minted Successfully!
          </h2>
          <motion.div
            className="shadow-lg rounded p-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="relative w-64 h-96 mx-auto bg-[#2f1a2d] rounded-xl overflow-hidden shadow-lg cursor-pointer"
              animate={{ rotateY: isFlipped ? 360 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{
                scale: 1.05,
              }}
              onClick={handleFlip}
              style={{
                boxShadow: "0px 0px 10px 5px rgba(255, 16, 240, 0.5)",
              }}
            >
              <div className="p-4 h-full flex flex-col justify-between">
                <div>
                  <img
                    src={mintedImageUrl || ""}
                    alt={mintedNFTDetails.nftName}
                    className="mt-4 rounded shadow"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                  <h3 className="text-xl font-bold text-white mb-1">
                    {mintedNFTDetails.nftName}
                  </h3>
                  <p className="text-sm text-white mb-2">
                    {mintedNFTDetails.description}
                  </p>
                </div>
                <div>
                  {mintedNFTDetails.attributes.map(
                    (attr: any, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs font-semibold text-white mr-1 mb-1"
                      >
                        {attr.key}: {attr.value}
                      </span>
                    )
                  )}
                  <p className="text-xs text-white mt-2">
                    TX: {mintedNFTDetails.transactionHash.slice(0, 10)}...
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          <div className="flex justify-center mt-10">
            <RippleButton
              text="Mint Another NFT"
              onClick={resetFields}
              active
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ImageUploader;
