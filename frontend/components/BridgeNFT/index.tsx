// // components/BridgeNFT.tsx
// import { useEffect, useState } from 'react';
// import { useWriteContract } from 'wagmi'; // Adjust the import based on your contract interaction library
// import { ethers } from 'ethers';

// const BridgeNFT: React.FC = () => {
//   const contract = useWriteContract('0xDdFCfb6C6dDA3eab52cA8FB78c94A6A973fA9De5'); // Replace 'SepoliaBridgeContract' with the actual name or address of your Sepolia bridge contract
//   const [isListening, setIsListening] = useState(false);
//   const [bridgeEvents, setBridgeEvents] = useState<any[]>([]); // Define the structure based on the events emitted

//   useEffect(() => {
//     if (contract && !isListening) {
//       setIsListening(true);
//       contract.on('NFTLocked', (from, tokenId, toChain) => {
//         // Handle the event when an NFT is locked on Sepolia
//         setBridgeEvents((prevEvents) => [
//           ...prevEvents,
//           { from, tokenId, toChain },
//         ]);
//         // Trigger minting on Base Testnet or other actions
//         mintNFTOnTestnet(tokenId, toChain); // Implement this function
//       });

//       return () => {
//         contract.off('NFTLocked'); // Cleanup event listener
//       };
//     }
//   }, [contract, isListening]);

//   const mintNFTOnTestnet = async (tokenId: number, toChain: string) => {
//     // Implement logic to mint NFT on Base Testnet
//     try {
//       // Connect to Base Testnet provider
//       const provider = new ethers.providers.JsonRpcProvider('https://base-testnet-provider-url');

//       // Example minting logic (replace with your contract and method)
//       const contract = new ethers.Contract('BaseTestnetNFTContractAddress', ['function mintNFT(uint256)'], provider.getSigner());
//       const transaction = await contract.mintNFT(tokenId);

//       // Wait for transaction confirmation
//       await transaction.wait();

//       console.log('NFT minted on Base Testnet:', tokenId);
//     } catch (error) {
//       console.error('Error minting NFT on Base Testnet:', error);
//     }
//   };

//   return (
//     <div>
//       <h2>Bridge NFTs</h2>
//       <ul>
//         {bridgeEvents.map((event, index) => (
//           <li key={index}>
//             {`NFT ID ${event.tokenId} locked on ${event.from} bridged to ${event.toChain}`}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default BridgeNFT;
