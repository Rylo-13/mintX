"use client";
import RippleButton from "@/components/Buttons/RippleButton";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import contractABI from "../../aiArtABI.json";
import NFTCard from "@/components/NFTCard";
import React, { useState } from "react";
import { motion } from "framer-motion";
import AddIcon from "../Icons/AddIcon";
import axios from "axios";
import XIcon from "../Icons/XIcon";
import UploadIcon from "../Icons/UploadIcon";

const ImageUploader: React.FC = () => {
  const { isConnected } = useAccount();
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // Holds the selected image file for upload or generation
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
  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >([{ key: "", value: "" }]); // Stores attributes (key-value pairs) associated with the NFT

  const contractAddress = "0xe5ac9aB13f517A3c6e717c6533137B62c98f35BB";
  const abi = contractABI.abi;
  const config = useConfig();

  const { writeContractAsync } = useWriteContract();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors("File size exceeds 5MB. Please choose a smaller file.");
        return;
      }
      setSelectedImage(selectedFile);
      setUploadedImageUrl(URL.createObjectURL(selectedFile));
      setErrors("");
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setIsGeneratedImageUrl(null);
    setErrors("");
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

  const handleMintNFT = async () => {
    if (!isConnected) {
      setErrors("Wallet is not connected.");
      return;
    }

    if ((!selectedImage && !generatedImageUrl) || !nftName || !nftDescription) {
      return;
    }

    setIsMinting(true);

    try {
      // Handle image buffer
      const imageBuffer = generatedImageUrl
        ? await (
            await axios.get(
              `/api/fetchImageToMint?imageUrl=${encodeURIComponent(
                generatedImageUrl
              )}`,
              { responseType: "arraybuffer" }
            )
          ).data
        : selectedImage
        ? await selectedImage.arrayBuffer()
        : null;

      if (!imageBuffer) {
        throw new Error("No image available for upload");
      }

      // Pin image to IPFS using custom API route
      const pinFileResponse = await axios.post(
        "/api/pinFileToIPFS",
        imageBuffer,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageHash = pinFileResponse.data.IpfsHash;
      const imageURI = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

      setUploadedImageUrl(imageURI);

      // Prepare metadata
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageURI,
        attributes,
      };

      // Pin metadata to IPFS using custom API route
      const pinJSONResponse = await axios.post("/api/pinJSONToIPFS", metadata, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const metadataURI = `https://gateway.pinata.cloud/ipfs/${pinJSONResponse.data.IpfsHash}`;

      // Mint NFT
      const transactionHash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: "mintNFT",
        args: [metadataURI],
      });

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, {
        hash: transactionHash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed");
      }

      setMintedNFTDetails({
        nftName,
        nftDescription,
        image: imageURI,
        attributes,
        transactionHash,
      });

      setMintedImageUrl(isGenerated ? generatedImageUrl : imageURI);

      setIsCompleted(true);
      console.log("Transaction Hash:", transactionHash);
    } catch (err) {
      console.error("Error uploading image or interacting with contract:", err);
      setErrors(
        `Failed to upload image or interact with contract. Error: ${err}`
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
    <div className="container mx-auto max-w-xl my-4 p-4">
      {!isCompleted && (
        <div className="border bg-[#101010] p-10">
          <div className="py-1.5 px-1.5 mb-5 border rounded bg-black flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
            <RippleButton
              className="w-full sm:w-56"
              text="Upload Image"
              onClick={() => setIsGenerated(false)}
              active={!isGenerated}
            />

            <RippleButton
              className="w-full sm:w-56"
              text="Create Image"
              onClick={() => setIsGenerated(true)}
              active={isGenerated}
            />
          </div>

          {!isGenerated && (
            <div className="mb-5">
              <div className="relative flex justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileInputChange}
                />
                {!selectedImage && (
                  <div className="w-2/3 flex flex-col items-center justify-center p-10 border border-dashed rounded-lg text-center text-gray-400">
                    <UploadIcon className="w-12 h-12 mb-2" />
                    <p className="mb-2">Click to upload an image</p>
                    <p>or drag and drop here</p>
                  </div>
                )}
                {selectedImage && (
                  <div className="my-8 flex justify-center">
                    <motion.div
                      className="mt-3 flex items-start"
                      initial={{ y: -550 }}
                      animate={{ y: -10 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="relative">
                        <img
                          src={uploadedImageUrl!}
                          alt="Uploaded Image"
                          className="rounded shadow-md shadow-[#989898]"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                        <XIcon
                          className="h-6 w-6 cursor-pointer bg-[#aeaeae67] m-1 rounded"
                          onClick={handleClearImage}
                          style={{
                            position: "absolute",
                            top: 15,
                            right: 15,
                            transform: "translate(50%, -50%)",
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
              {errors && <p className="text-red-500 text-sm mt-2">{errors}</p>}
            </div>
          )}
          {isGenerated && (
            <div className="mb-5">
              <div className="relative mb-4 w-full">
                {!generatedImageUrl && (
                  <div className="flex flex-col items-center justify-center">
                    <input
                      className="w-full px-3 py-1.5 border pr-24"
                      type="text"
                      placeholder="AI Image Description"
                      value={aiImageDescription}
                      onChange={(e) => setAiImageDescription(e.target.value)}
                    />
                    <div className="w-2/3 flex flex-col items-center justify-center mt-5 p-10 border border-dashed rounded-lg text-center text-gray-400">
                      <UploadIcon className="w-12 h-12 mb-2" />
                      <p className="mb-2">
                        Enter an AI description and generate an image!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{
                        scale: 1.01,
                        textShadow: "0px 0px 10px rgb(255, 255, 255)",
                        boxShadow: "0px 0px 10px rgb(255, 255, 255)",
                      }}
                      className="absolute right-0 top-0 px-4 mt-0.5 mr-0.5 py-1 bg-black text-white rounded border border-white hover:border-[#D600C4]"
                      disabled={isGenerating}
                      onClick={handleGenerateImage}
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </motion.button>
                  </div>
                )}
              </div>
              {generatedImageUrl && (
                <div className="my-8 flex justify-center">
                  <motion.div
                    className="mt-3 flex items-start"
                    initial={{ y: -550 }}
                    animate={{ y: -10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <img
                        src={generatedImageUrl}
                        alt="Generated Image"
                        className="rounded shadow-md shadow-[#989898]"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                      <XIcon
                        className="h-6 w-6 cursor-pointer bg-[#ffffff67] m-1 rounded"
                        onClick={handleClearImage}
                        style={{
                          position: "absolute",
                          top: 15,
                          right: 15,
                          transform: "translate(50%, -50%)",
                        }}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
          <>
            <div className="mb-4">
              <input
                className="mb-2 w-full px-3 py-1.5 border"
                type="text"
                placeholder="Name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
              />
              <textarea
                className="w-full px-3 py-1.5 border"
                placeholder="Description"
                value={nftDescription}
                onChange={(e) => setNFTDescription(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Attributes</h3>
              {attributes.map((attribute, index) => (
                <div key={index} className="flex mb-3">
                  <div className="flex w-full gap-x-3 relative">
                    <input
                      className="w-1/2 px-3 py-1.5 border"
                      type="text"
                      placeholder="Key"
                      value={attribute.key}
                      onChange={(e) =>
                        handleAttributeChange(index, "key", e.target.value)
                      }
                    />
                    <input
                      className="w-1/2 px-3 py-1.5 border"
                      type="text"
                      placeholder="Value"
                      value={attribute.value}
                      onChange={(e) =>
                        handleAttributeChange(index, "value", e.target.value)
                      }
                    />
                    {index > 0 && (
                      <XIcon
                        className="h-8 w-8 cursor-pointer absolute top-0 right-0.5 mt-0.5 lg:mt-1"
                        // className="h-8 w-8 cursor-pointer absolute top-0 left-full mt-1.5 ml-1"
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
          <RippleButton
            className="w-full"
            text={isMinting ? "Confirming..." : "Mint NFT"}
            onClick={handleMintNFT}
            active
          />
          {errors && <p className="text-red-500 mt-4">{errors}</p>}
        </div>
      )}
      {isCompleted && mintedNFTDetails && (
        <>
          <h2 className="flex justify-center mt-16 mb-10 text-3xl font-semibold text-white">
            NFT Minted Successfully!
          </h2>
          <NFTCard
            imageUrl={mintedNFTDetails.image}
            nftName={mintedNFTDetails.nftName}
            nftDescription={mintedNFTDetails.nftDescription}
            attributes={mintedNFTDetails.attributes}
            transactionHash={mintedNFTDetails.transactionHash}
          />
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
