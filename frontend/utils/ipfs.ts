import { IPFS_GATEWAY } from "@/constants";

export const getIPFSUrl = (hash: string): string => {
  if (!hash) return "";
  const cleanHash = hash.replace("ipfs://", "");
  return `${IPFS_GATEWAY}${cleanHash}`;
};

export const uploadToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/pinFileToIPFS", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload to IPFS");
  }

  const data = await response.json();
  return data.IpfsHash;
};

export const uploadJSONToIPFS = async (metadata: object): Promise<string> => {
  const response = await fetch("/api/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error("Failed to upload JSON to IPFS");
  }

  const data = await response.json();
  return data.IpfsHash;
};
