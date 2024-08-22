import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia, avalancheFuji } from "wagmi/chains";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, arbitrumSepolia, avalancheFuji],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(process.env.SEPOLIA_RPC_URL),
      [arbitrumSepolia.id]: http(process.env.ARBITRUM_RPC_URL),
      [avalancheFuji.id]: http(process.env.FUJI_RPC_URL),
    },
  });
}
