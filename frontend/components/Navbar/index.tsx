"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import Link from "next/link";
import MintXIcon from "@/components/ui/Icons/MintXIcon";
import RippleButton from "@/components/ui/Buttons/RippleButton";

const ConnectButtonWrapper = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setIsMobile(/Mobile|Android|iPhone/i.test(navigator.userAgent));
  }, []);

  return (
    <Suspense
      fallback={
        <div className="w-32 h-10 bg-gray-700 rounded-2xl animate-pulse" />
      }
    >
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          // On mobile with ethereum, try direct connection
          const handleMobileConnect = async () => {
            if (isMobile && typeof window !== "undefined" && window.ethereum) {
              try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
              } catch (error) {
                console.error("Mobile connection failed:", error);
              }
            }
            openConnectModal();
          };

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <RippleButton
                      text="Connect"
                      onClick={isMobile ? handleMobileConnect : openConnectModal}
                      active
                      className="text-sm font-light py-2 px-6"
                    />
                  );
                }

                if (chain.unsupported) {
                  return (
                    <RippleButton
                      text="Wrong network"
                      onClick={openChainModal}
                      active
                      className="text-sm font-light py-2 px-6"
                    />
                  );
                }

                return (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openChainModal}
                      className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-2xl transition-colors border border-white/10"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                    </button>

                    <RippleButton
                      text={account.displayName}
                      onClick={openAccountModal}
                      active
                      className="text-sm font-light py-2 px-6"
                    />
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </Suspense>
  );
};

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-white" : "text-gray-400 hover:text-white";
  };

  return (
    <div className="drawer sticky top-0 h-20 w-full bg-[#0D0D0D] items-center z-30">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content h-full">
        <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo and Nav Links */}
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:scale-105 transition-transform">
                <MintXIcon className="w-9 h-9" />
              </Link>

              <label
                htmlFor="my-drawer"
                className="drawer-button lg:hidden cursor-pointer hover:text-white transition-colors text-gray-400"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </label>

              <ul className="hidden lg:flex items-center gap-6 text-base font-normal ml-5">
                <li>
                  <Link
                    href="/mint"
                    className={`cursor-pointer transition-colors ${isActive(
                      "/mint"
                    )}`}
                  >
                    Mint
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bridge"
                    className={`cursor-pointer transition-colors ${isActive(
                      "/bridge"
                    )}`}
                  >
                    Bridge
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery"
                    className={`cursor-pointer transition-colors ${isActive(
                      "/gallery"
                    )}`}
                  >
                    Gallery
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <ConnectButtonWrapper />
        </div>
      </div>
      <div className="drawer-side z-40">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="bg-[#0D0D0D] min-h-full w-2/3 border-r border-white/10 relative z-50">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex hover:scale-105 transition-transform"
            >
              <MintXIcon className="w-9 h-9" />
            </Link>
            <label
              htmlFor="my-drawer"
              className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </label>
          </div>
          <ul className="menu text-base-content p-6 space-y-1">
            <li>
              <Link
                href="/mint"
                className={`cursor-pointer transition-colors rounded-lg hover:bg-white/5 ${isActive(
                  "/mint"
                )}`}
              >
                Mint
              </Link>
            </li>
            <li>
              <Link
                href="/bridge"
                className={`cursor-pointer transition-colors rounded-lg hover:bg-white/5 ${isActive(
                  "/bridge"
                )}`}
              >
                Bridge
              </Link>
            </li>
            <li>
              <Link
                href="/gallery"
                className={`cursor-pointer transition-colors rounded-lg hover:bg-white/5 ${isActive(
                  "/gallery"
                )}`}
              >
                Gallery
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
