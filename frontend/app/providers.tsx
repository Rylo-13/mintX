"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { getConfig } from "./wagmi";
import { sepolia } from "wagmi/chains";

type Props = {
  children: ReactNode;
  initialState: State | undefined;
};

export function Providers({ children, initialState }: Props) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Wagmi's official recommendation for blockchain data
            gcTime: 1_000 * 60 * 60 * 24, // 24 hours
            // Reasonable staleTime for NFT data
            staleTime: 1_000 * 60 * 5, // 5 minutes
            // Retry failed requests (good for IPFS)
            retry: 2,
            // Don't refetch on window focus for NFT data
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          coolMode
          showRecentTransactions={true}
          initialChain={sepolia}
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#D600C4",
            accentColorForeground: "white",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
