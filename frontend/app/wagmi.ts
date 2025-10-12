import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia, avalancheFuji } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, arbitrumSepolia, avalancheFuji],
    connectors: [
      injected({
        shimDisconnect: true,
      }),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
        showQrModal: true,
      }),
    ],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
      [arbitrumSepolia.id]: http(process.env.ARBITRUM_RPC_URL),
      [avalancheFuji.id]: http(process.env.FUJI_RPC_URL),
    },
  });
}
