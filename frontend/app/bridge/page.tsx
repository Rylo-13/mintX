// "use client";
// import RippleButton from "@/components/Buttons/RippleButton";
// import {
//   useAccount,
//   useConfig,
//   useWriteContract,
//   usePublicClient,
// } from "wagmi";
// import contractABI from "../../aiArtABI.json";
// import whBridgeAbi from "../../IWormholeNFTBridge.json";
// import React, { useState, useEffect, useCallback } from "react";
// import { RingLoader } from "react-spinners";
// import { sepolia, arbitrumSepolia } from "wagmi/chains";
// import Select from "react-select";
// import { ethers } from "ethers";
// import {
//   attestFromEth,
//   parseSequenceFromLogEth,
//   getEmitterAddressEth,
//   getSignedVAA,
//   transferFromEth,
// } from "@certusone/wormhole-sdk";

// const Page: React.FC = () => {
//   const { isConnected, address } = useAccount(); // Get connected wallet address
//   const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
//   const [targetChain, setTargetChain] = useState<number | null>(null);
//   const [isBridging, setIsBridging] = useState(false);
//   const [errors, setErrors] = useState("");
//   const [isCompleted, setIsCompleted] = useState(false);
//   const [transactionHash, setTransactionHash] = useState<string | null>(null);
//   const [nftOptions, setNftOptions] = useState<
//     { value: string; label: string }[]
//   >([]); // State for NFT options

//   const sepoliaCA = process.env.SEPOLIA_CA! as `0x${string}`;
//   const arbitrumSepoliaCA = process.env.ARBITRUM_SEPOLIA_CA! as `0x${string}`;
//   const aiArtAbi = contractABI.abi;
//   const config = useConfig();
//   const publicClient = usePublicClient();
//   const { writeContractAsync } = useWriteContract();

//   const WORMHOLE_RPC_HOST = "https://api.testnet.wormholescan.io";

//   const CHAIN_ID_SEPOLIA = 10002;
//   const CHAIN_ID_ARBITRUM_SEPOLIA = 10003;

//   const chainOptions = [
//     { value: CHAIN_ID_SEPOLIA, label: sepolia.name },
//     { value: CHAIN_ID_ARBITRUM_SEPOLIA, label: arbitrumSepolia.name },
//   ];

//   const sepoliaProvider = new ethers.providers.JsonRpcProvider(
//     process.env.SEPOLIA_RPC_URL
//   );
//   const arbitrumSepoliaProvider = new ethers.providers.JsonRpcProvider(
//     process.env.ARBITRUM_SEPOLIA_RPC_URL
//   );

//   const sepoliaSigner = new ethers.Wallet(
//     process.env.SEPOLIA_PRIVATE_KEY!,
//     sepoliaProvider
//   );
//   const arbitrumSepoliaSigner = new ethers.Wallet(
//     process.env.SEPOLIA_PRIVATE_KEY!,
//     arbitrumSepoliaProvider
//   );

//   const fetchNFTs = useCallback(async () => {
//     if (isConnected && address) {
//       try {
//         const nftOptions: { value: string; label: string }[] = [];
//         const nftCount = (await publicClient?.readContract({
//           address: sepoliaCA,
//           abi: aiArtAbi,
//           functionName: "balanceOf",
//           args: [address],
//         })) as bigint;

//         for (let i = 0; i < Number(nftCount); i++) {
//           const tokenId = (await publicClient?.readContract({
//             address: sepoliaCA,
//             abi: aiArtAbi,
//             functionName: "tokenOfOwnerByIndex",
//             args: [address, BigInt(i)],
//           })) as bigint;

//           const tokenURI = (await publicClient?.readContract({
//             address: sepoliaCA,
//             abi: aiArtAbi,
//             functionName: "tokenURI",
//             args: [tokenId],
//           })) as string;

//           let resolvedTokenURI = tokenURI;
//           if (tokenURI.startsWith("ipfs://")) {
//             resolvedTokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
//           }

//           const response = await fetch(resolvedTokenURI);
//           const metadata = await response.json();

//           nftOptions.push({
//             value: tokenId.toString(),
//             label: metadata.name,
//           });
//         }

//         setNftOptions(nftOptions);
//       } catch (error) {
//         console.error("Error fetching NFTs:", error);
//         setErrors("Failed to fetch NFTs.");
//       }
//     }
//   }, [isConnected, address, publicClient, sepoliaCA, aiArtAbi]);

//   useEffect(() => {
//     fetchNFTs();
//   }, [fetchNFTs]);

//   const handleBridgeNFT = async () => {
//     if (!isConnected) {
//       setErrors("Wallet is not connected.");
//       return;
//     }

//     if (!selectedNFT || !targetChain) {
//       setErrors("Please select an NFT and target chain.");
//       return;
//     }

//     setIsBridging(true);

//     try {
//       // Step 1: Attest the NFT on Sepolia
//       const receiptAttest = await attestFromEth(
//         sepoliaCA,
//         sepoliaSigner,
//         selectedNFT
//       );

//       // Step 2: Get the sequence number and emitter address for attestation
//       const sequenceAttest = parseSequenceFromLogEth(receiptAttest, sepoliaCA);
//       const emitterAddressAttest = getEmitterAddressEth(sepoliaCA);

//       // Step 3: Fetch the signed VAA for attestation
//       const { signedVAA: signedVAAAttest } = await getSignedVAA(
//         WORMHOLE_RPC_HOST,
//         CHAIN_ID_SEPOLIA,
//         emitterAddressAttest,
//         sequenceAttest
//       );

//       console.log("Attestation VAA:", signedVAAAttest);

//       // Step 4: Transfer the NFT from Sepolia to Arbitrum Sepolia
//       const recipientAddress = ethers.utils.arrayify(
//         arbitrumSepoliaSigner.address
//       ); // Convert to Uint8Array
//       const relayerFee = ethers.utils.parseEther("0.01"); // Example fee, adjust as necessary

//       const receiptTransfer = await transferFromEth(
//         sepoliaCA,
//         sepoliaSigner,
//         selectedNFT,
//         1, // Amount is usually 1 for NFT transfers
//         CHAIN_ID_ARBITRUM_SEPOLIA,
//         recipientAddress,
//         relayerFee,
//         {}, // Overrides (e.g., gas limit) if needed
//         null // Payload (optional)
//       );

//       // Step 5: Get the sequence number and emitter address for the transfer
//       const sequenceTransfer = parseSequenceFromLogEth(
//         receiptTransfer,
//         sepoliaCA
//       );
//       const emitterAddressTransfer = getEmitterAddressEth(sepoliaCA);

//       // Step 6: Fetch the signed VAA for the transfer
//       const { signedVAA: signedVAATransfer } = await getSignedVAA(
//         WORMHOLE_RPC_HOST,
//         CHAIN_ID_SEPOLIA,
//         emitterAddressTransfer,
//         sequenceTransfer
//       );

//       // Step 7: Post the VAA on Arbitrum Sepolia and complete the transfer
//       const bridgeContract = new ethers.Contract(
//         arbitrumSepoliaCA,
//         aiArtAbi,
//         arbitrumSepoliaSigner
//       );
//       const tx = await bridgeContract.completeTransferNFT(
//         signedVAATransfer,
//         selectedNFT
//       );
//       const receiptArbitrum = await tx.wait();

//       setTransactionHash(receiptArbitrum.transactionHash);
//       setIsCompleted(true);
//     } catch (err) {
//       console.error("Error bridging NFT:", err);
//       setErrors(`Failed to bridge NFT. Error: ${err}`);
//     } finally {
//       setIsBridging(false);
//     }
//   };

//   return (
//     <div>
//       {isBridging ? (
//         <RingLoader color="#36d7b7" />
//       ) : isCompleted ? (
//         <div>
//           <p>Bridging completed!</p>
//           {transactionHash && <p>Transaction Hash: {transactionHash}</p>}
//         </div>
//       ) : (
//         <div>
//           {errors && <p className="text-red-500">{errors}</p>}
//           <div>
//             <Select
//               options={chainOptions}
//               onChange={(option) => setTargetChain(option?.value || null)}
//               placeholder="Select Target Chain"
//             />
//           </div>
//           <div>
//             <Select
//               options={nftOptions}
//               onChange={(option) => setSelectedNFT(option?.value || null)}
//               placeholder="Select NFT to Bridge"
//             />
//           </div>
//           <RippleButton
//             className="w-full"
//             text={isBridging ? "Bridging..." : "Bridge NFT"}
//             onClick={handleBridgeNFT}
//             disabled={isBridging || !selectedNFT || !targetChain}
//             active
//           />{" "}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Page;

const Page = () => {
  return (
    <div className="pt-16 flex justify-center items-center text-center">
      BRIDGE!
    </div>
  );
};

export default Page;
