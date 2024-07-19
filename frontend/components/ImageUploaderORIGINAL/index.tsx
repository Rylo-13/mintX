// "use client";
// import React, { useEffect, useState } from "react";
// import { create } from "ipfs-http-client";
// // import { createHelia } from 'helia'
// import { useAccount, useWriteContract } from "wagmi";
// import contractABI from "../../artNFTABI.json";
// import RippleButton from "@/components/RippleButton";
// import { motion } from "framer-motion";

// const ImageUploader: React.FC = () => {
//   const { isConnected } = useAccount();
//   const [image, setImage] = useState<File | null>(null); // State to manage the selected image file from the user
//   const [generatedImage, setGeneratedImage] = useState<string | null>(null); // State to store the generated image URL after using an AI image generator API
//   const [aiImageDescription, setAiImageDescription] = useState(""); // State to store the description for generating an AI image
//   const [started, setStarted] = useState(false); // State to indicate if the process has started
//   const [errors, setErrors] = useState(""); // State to store any errors that occur during the process
//   const [completed, setCompleted] = useState(false); // State to indicate if the process has completed
//   const [ipfsClient, setIpfsClient] = useState<any>(null); // State to store the IPFS client instance
//   const [generated, setGenerated] = useState(false); // State to indicate if the image generation process is completed
//   const [uploadedImage, setUploadedImage] = useState<string | null>(null); // State to store the URL of the uploaded image
//   const [mintedNFT, setMintedNFT] = useState<any>(null); // State to store the details of the minted NFT
//   const [mintedImageUrl, setMintedImageUrl] = useState<string | null>(null); // State to store the URL of the minted image
//   const [nftName, setNftName] = useState(""); // State to store the name input value for the image/NFT
//   const [description, setDescription] = useState(""); // State to store the description input value for the image/NFT
//   // State to manage the list of attributes for the image/NFT, initialized with one empty attribute
//   const [attributes, setAttributes] = useState<
//     { key: string; value: string }[]
//   >([{ key: "", value: "" }]);

//   const contractAddress = "0x4A88aeC5786B9C913ca8Cb8CE0A5071A2C323934";
//   const abi = contractABI.abi;

//   const { writeContractAsync } = useWriteContract();

//   useEffect(() => {
//     if (isConnected) {
//       initIpfs();
//     }
//   }, [isConnected]);

//   const initIpfs = async () => {
//     if (ipfsClient) {
//       return ipfsClient;
//     }

//     try {
//       const auth =
//         "Basic " +
//         Buffer.from(
//           `${process.env.NEXT_PUBLIC_IPFS_API_KEY}:${process.env.NEXT_PUBLIC_IPFS_API_SECRET}`
//         ).toString("base64");
//       const client = create({
//         host: "ipfs.infura.io",
//         port: 5001,
//         protocol: "https",
//         headers: {
//           authorization: auth,
//         },
//       });
//       setIpfsClient(client);
//       return client;
//     } catch (error) {
//       console.error("Error initializing IPFS client:", error);
//       setErrors("Failed to initialize IPFS client. Please try again.");
//       return null;
//     }
//   };

//   const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files ? e.target.files[0] : null;
//     if (selectedFile) {
//       setImage(selectedFile);
//       setUploadedImage(URL.createObjectURL(selectedFile));
//     }
//   };

//   const handleClearImage = () => {
//     setImage(null);
//     setUploadedImage(null);
//   };

//   const handleAddAttribute = () => {
//     setAttributes([...attributes, { key: "", value: "" }]);
//   };

//   const handleDeleteAttribute = (index: number) => {
//     const updatedAttributes = [...attributes];
//     updatedAttributes.splice(index, 1);
//     setAttributes(updatedAttributes);
//   };

//   const handleAttributeChange = (
//     index: number,
//     field: "key" | "value",
//     value: string
//   ) => {
//     const updatedAttributes = [...attributes];
//     updatedAttributes[index][field] = value;
//     setAttributes(updatedAttributes);
//   };

//   const resetFields = () => {
//     setImage(null);
//     setGeneratedImage(null);
//     setAiImageDescription("");
//     setErrors("");
//     setStarted(false);
//     setGenerated(false);
//     setUploadedImage(null);
//     setMintedNFT(null);
//     setMintedImageUrl(null);
//     setNftName("");
//     setDescription("");
//     setAttributes([{ key: "", value: "" }]);
//     setCompleted(false);
//   };

//   const handleImageUpload = async () => {
//     if (!isConnected) {
//       setErrors("Wallet is not connected.");
//       return;
//     }

//     if ((!image && !generatedImage) || !nftName || !description) return;

//     setStarted(true);

//     try {
//       let client = ipfsClient;
//       if (!client) {
//         client = await initIpfs();
//         if (!client) return; // If IPFS client initialization failed
//       }

//       let imageBuffer: ArrayBuffer | Buffer;

//       if (generated && generatedImage) {
//         const response = await fetch(generatedImage);
//         imageBuffer = await response.arrayBuffer();
//       } else if (image) {
//         imageBuffer = await image.arrayBuffer();
//       } else {
//         throw new Error("No image available for upload");
//       }

//       const uploaded = await client.add(imageBuffer);
//       const imageHash = uploaded.path;
//       const imageURI = `https://ipfs.infura.io/ipfs/${imageHash}`;

//       setUploadedImage(imageURI);

//       const metadata = {
//         name: nftName,
//         description,
//         image: imageURI,
//         attributes,
//       };

//       const metadataBuffer = Buffer.from(JSON.stringify(metadata));
//       const metadataUploaded = await client.add(metadataBuffer);
//       const metadataURI = `https://ipfs.infura.io/ipfs/${metadataUploaded.path}`;

//       const data = await writeContractAsync({
//         abi,
//         address: contractAddress,
//         functionName: "uploadImage",
//         args: [metadataURI],
//       });

//       // Save minted NFT details to state
//       setMintedNFT({
//         nftName,
//         description,
//         image: imageURI,
//         attributes,
//         transactionHash: data, // Save transaction hash for reference if needed
//       });

//       setMintedImageUrl(generated ? generatedImage : imageURI); // Set minted image URL

//       setCompleted(true);
//       console.log("Transaction Hash:", data);
//     } catch (err) {
//       console.error("Error uploading image or interacting with contract:", err);
//       setErrors(
//         "Failed to upload image or interact with contract. Please try again."
//       );
//     } finally {
//       setStarted(false);
//     }
//   };
//   const handleGenerateImage = async () => {
//     if (!aiImageDescription) return;

//     setStarted(true);

//     try {
//       const response = await fetch("/api/generateImage", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ aiImageDescription }),
//       });

//       const { imageUrl } = await response.json();
//       setGeneratedImage(imageUrl);
//     } catch (error) {
//       console.error("Error generating images:", error);
//       setErrors("Failed to generate image. Please try again.");
//     } finally {
//       setStarted(false);
//     }
//   };

//   return (
//     <div className="container mx-auto max-w-lg p-4">
//       {!completed && (
//         <div className="shadow-md rounded p-4">
//           <div className="flex justify-between mb-4">
//             <RippleButton
//               text="Upload Image"
//               onClick={() => setGenerated(false)}
//               active={!generated}
//             />
//             <RippleButton
//               text="Generate Image"
//               onClick={() => setGenerated(true)}
//               active={generated}
//             />
//           </div>
//           {!generated && (
//             <div className="mb-4">
//               <input
//                 type="file"
//                 onChange={handleFileInputChange}
//                 className="mb-4 w-full p-2 border rounded"
//               />
//               {uploadedImage && (
//                 <div className="relative">
//                   <img
//                     src={uploadedImage}
//                     alt="Selected"
//                     className="mt-4 rounded shadow"
//                     style={{ maxWidth: "100%", height: "auto" }}
//                   />
//                   <button
//                     className="absolute top-0 right-0 m-2 p-1 rounded-full bg-red-500 text-white"
//                     onClick={handleClearImage}
//                   >
//                     X
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//           {generated && (
//             <div className="mb-4">
//               <input
//                 className="mb-2 w-full p-2 border rounded"
//                 type="text"
//                 placeholder="AI Image Description"
//                 value={aiImageDescription}
//                 onChange={(e) => setAiImageDescription(e.target.value)}
//               />
//               <button
//                 className="px-4 py-2 bg-blue-500 text-white rounded"
//                 disabled={started}
//                 onClick={handleGenerateImage}
//               >
//                 {started ? "Generating..." : "Generate AI Image"}
//               </button>
//               {generatedImage && (
//                 <img
//                   src={generatedImage}
//                   alt="Generated"
//                   className="mt-4 rounded shadow"
//                   style={{ maxWidth: "100%", height: "auto" }}
//                 />
//               )}
//             </div>
//           )}
//           <div className="mb-4">
//             <input
//               className="mb-2 w-full p-2 border rounded"
//               type="text"
//               placeholder="Name"
//               value={nftName}
//               onChange={(e) => setNftName(e.target.value)}
//             />
//             <textarea
//               className="w-full p-2 border rounded"
//               placeholder="Description"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//             />
//           </div>
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold mb-2">Attributes</h3>
//             {attributes.map((attribute, index) => (
//               <div key={index} className="mb-2 flex">
//                 <input
//                   className="w-1/2 p-2 border rounded mr-2"
//                   type="text"
//                   placeholder="Key"
//                   value={attribute.key}
//                   onChange={(e) =>
//                     handleAttributeChange(index, "key", e.target.value)
//                   }
//                 />
//                 <input
//                   className="w-1/2 p-2 border rounded"
//                   type="text"
//                   placeholder="Value"
//                   value={attribute.value}
//                   onChange={(e) =>
//                     handleAttributeChange(index, "value", e.target.value)
//                   }
//                 />
//                 <button
//                   className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
//                   onClick={() => handleDeleteAttribute(index)}
//                   disabled={attributes.length === 1} // Disable if there's only one attribute
//                 >
//                   Delete
//                 </button>
//               </div>
//             ))}
//             <button
//               className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
//               onClick={handleAddAttribute}
//             >
//               Add Attribute
//             </button>
//           </div>
//           {errors && <p className="text-red-500 mb-4">{errors}</p>}
//           <button
//             className="px-4 py-2 bg-blue-500 text-white rounded"
//             disabled={started}
//             onClick={handleImageUpload}
//           >
//             {started ? "Minting..." : "Mint NFT"}
//           </button>
//         </div>
//       )}
//       {completed && mintedNFT && (
//         <div className="shadow-md rounded p-4">
//           <h2 className="flex justify-center text-2xl font-semibold text-[#FF10F0] mb-4">
//             NFT Minted Successfully!
//           </h2>
//           <motion.div
//             className="relative w-64 h-96 mx-auto bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl overflow-hidden shadow-lg"
//             initial={{ rotateY: 180 }}
//             animate={{ rotateY: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <div className="p-4 h-full flex flex-col justify-between">
//               <div>
//                 {mintedImageUrl && (
//                   <img
//                     src={mintedImageUrl}
//                     alt="Minted"
//                     className="mt-4 rounded shadow"
//                     style={{ maxWidth: "100%", height: "auto" }}
//                   />
//                 )}
//                 <h3 className="text-xl font-bold text-white mb-1">
//                   {mintedNFT.nftName}
//                 </h3>
//                 <p className="text-sm text-white mb-2">
//                   {mintedNFT.description}
//                 </p>
//               </div>
//               <div>
//                 {mintedNFT.attributes.map((attr: any, index: any) => (
//                   <span
//                     key={index}
//                     className="inline-block bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs font-semibold text-white mr-1 mb-1"
//                   >
//                     {attr.key}: {attr.value}
//                   </span>
//                 ))}
//                 <p className="text-xs text-white mt-2">
//                   TX: {mintedNFT.transactionHash.slice(0, 10)}...
//                 </p>
//               </div>
//             </div>
//           </motion.div>
//           <div className="flex justify-center mt-4">
//             <RippleButton
//               text="Mint Another NFT"
//               onClick={resetFields}
//               active
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageUploader;

// const handleUploadImage = async (file: File) => {
//   if (file) {
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const response = await axios({
//         method: "POST",
//         url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
//         data: formData,
//         headers: {
//           pinata_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
//           pinata_secret_api_key: `${process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY}`,
//           ContentType: "multipart/form-data",
//         },
//       });

//       const ImgHash = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       return null;
//     }
//   }
// };
