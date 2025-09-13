"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import Link from "next/link";

const ConnectButtonWrapper = () => (
  <Suspense fallback={<div className="w-32 h-10 bg-gray-700 rounded-lg animate-pulse" />}>
    <ConnectButton
      label="Connect"
      accountStatus="address"
      chainStatus="icon"
    />
  </Suspense>
);

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-[#FF10F0]" : "text-white hover:text-[#FF10F0]";
  };

  return (
    <div className="drawer sticky top-0 h-16 w-full px-24 bg-black items-center border-b border-[#FF10F0] z-30">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex items-center justify-between">
          <div className="text-lg pb-1 flex items-center">
            <label
              htmlFor="my-drawer"
              className="bg-none drawer-button items-center text-2xl lg:hidden cursor-pointer z-30"
            >
              ☰
            </label>
            <ul className="hidden font-light lg:flex space-x-16">
              <li>
                <Link href="/" className={`cursor-pointer transition-colors ${isActive("/")}`}>
                  HOME
                </Link>
              </li>
              <li>
                <Link href="/mint" className={`cursor-pointer transition-colors ${isActive("/mint")}`}>
                  MINT
                </Link>
              </li>
              <li>
                <Link href="/bridge" className={`cursor-pointer transition-colors ${isActive("/bridge")}`}>
                  BRIDGE
                </Link>
              </li>
              <li>
                <Link href="/gallery" className={`cursor-pointer transition-colors ${isActive("/gallery")}`}>
                  GALLERY
                </Link>
              </li>
            </ul>
          </div>
          <ConnectButtonWrapper />
        </div>
      <div className="drawer-side z-20">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-black text-base-content pt-20 min-h-full w-2/3 p-5 border-r border-gray-700">
          <li>
            <Link href="/" className={`cursor-pointer transition-colors ${isActive("/")}`}>
              HOME
            </Link>
          </li>
          <li>
            <Link href="/mint" className={`cursor-pointer transition-colors ${isActive("/mint")}`}>
              MINT
            </Link>
          </li>
          <li>
            <Link href="/bridge" className={`cursor-pointer transition-colors ${isActive("/bridge")}`}>
              BRIDGE
            </Link>
          </li>
          <li>
            <Link href="/gallery" className={`cursor-pointer transition-colors ${isActive("/gallery")}`}>
              GALLERY
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
