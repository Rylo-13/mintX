import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia, avalancheFuji } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, arbitrumSepolia, avalancheFuji],
    connectors: [
      injected({
        shimDisconnect: true,
        target() {
          return {
            id: "injected",
            name: "Injected Wallet",
            provider:
              typeof window !== "undefined" ? window.ethereum : undefined,
          };
        },
      }),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
        showQrModal: true,
      }),
      coinbaseWallet({
        appName: "MintX",
        preference: "eoaOnly",
      }),
    ],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
      [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_FUJI_RPC_URL),
      [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    },
  });
}
