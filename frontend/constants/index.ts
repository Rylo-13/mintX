export * from "./chains";

export const API_ENDPOINTS = {
  GENERATE_IMAGE: "/api/generateImage",
  PIN_JSON_TO_IPFS: "/api/pinJSONToIPFS",
  PIN_FILE_TO_IPFS: "/api/pinFileToIPFS",
  PIN_SCREENSHOT_TO_IPFS: "/api/pinScreenshotToIPFS",
  FETCH_IMAGE_TO_MINT: "/api/fetchImageToMint",
} as const;

export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY;

export const TOAST_MESSAGES = {
  WALLET_CONNECT_SUCCESS: "Wallet connected successfully",
  WALLET_CONNECT_ERROR: "Failed to connect wallet",
  TRANSACTION_SUCCESS: "Transaction completed successfully",
  TRANSACTION_ERROR: "Transaction failed",
  MINT_SUCCESS: "NFT minted successfully",
  MINT_ERROR: "Failed to mint NFT",
  BRIDGE_SUCCESS: "NFT bridged successfully",
  BRIDGE_ERROR: "Failed to bridge NFT",
} as const;
