import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia, avalancheFuji } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

export function getConfig() {
  // Check if we're in a mobile wallet browser
  const isMobileWalletBrowser = typeof window !== "undefined" &&
    window.ethereum &&
    /Mobile|Android|iPhone/i.test(navigator.userAgent);

  const connectors = isMobileWalletBrowser
    ? [
        // On mobile wallet browsers, only show injected connector
        injected({
          shimDisconnect: true,
        }),
      ]
    : [
        // On desktop, show all connectors
        injected({
          target: "metaMask",
        }),
        injected(),
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
          metadata: {
            name: "MintX",
            description: "Create and bridge NFTs across chains",
            url: "https://mintx.vercel.app",
            icons: ["https://mintx.vercel.app/icon.png"],
          },
          showQrModal: true,
        }),
        coinbaseWallet({
          appName: "MintX",
        }),
      ];

  return createConfig({
    chains: [mainnet, sepolia, arbitrumSepolia, avalancheFuji],
    connectors,
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
