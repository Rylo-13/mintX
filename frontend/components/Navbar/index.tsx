"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import Link from "next/link";
import MintXIcon from "@/components/ui/Icons/MintXIcon";

const ConnectButtonWrapper = () => (
  <Suspense
    fallback={
      <div className="w-32 h-10 bg-gray-700 rounded-lg animate-pulse" />
    }
  >
    <ConnectButton label="Connect" accountStatus="address" chainStatus="icon" />
  </Suspense>
);

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-white" : "text-gray-400 hover:text-white";
  };

  return (
    <div className="drawer sticky top-0 h-20 w-full px-6 md:px-12 lg:px-20 bg-[#0D0D0D] items-center z-30">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex items-center justify-between h-full">
        <div className="flex items-center gap-12">
          <label
            htmlFor="my-drawer"
            className="drawer-button items-center text-2xl lg:hidden cursor-pointer z-30 hover:text-white transition-colors text-gray-400"
          >
            ☰
          </label>

          {/* Logo and Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:scale-105 transition-transform">
              <MintXIcon className="w-9 h-9" />
            </Link>

            <ul className="hidden lg:flex items-center gap-6 text-base font-normal">
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
      <div className="drawer-side z-20">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="bg-[#0D0D0D] min-h-full w-2/3 border-r border-white/10">
          <div className="p-6 border-b border-white/10">
            <Link
              href="/"
              className="inline-flex hover:scale-105 transition-transform"
            >
              <MintXIcon className="w-9 h-9" />
            </Link>
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
