import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { getConfig } from "./wagmi";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "300", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "MintX",
  description: "Create, mint and bridge NFTs on multiple blockchains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get("cookie")
  );

  return (
    <html lang="en" className="h-full">
      <body className={`${poppins.className} min-h-screen`}>
        <Providers initialState={initialState}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
