"use client";
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import React from "react";
import Link from "next/link";

const Navbar = () => {
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-[#FF10F0] ghost-btn" : "text-white";
  };

  const isActiveSide = (path: string) => {
    return pathname === path ? "text-[#FF10F0] ghost-btn" : "text-white";
  };

  useEffect(() => {
    // Simulate initialization process
    const initialize = async () => {
      // Perform any necessary initialization logic here
      setInitialized(true);
    };
    initialize();
  }, []);

  return (
    <div className="drawer sticky top-0 h-16 w-full px-24 bg-black items-center border-b border-[#FF10F0] z-30">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      {initialized && (
        <div className="drawer-content flex items-center justify-between">
          <div className="text-lg pb-1 flex items-center">
            <label
              htmlFor="my-drawer"
              className="bg-none drawer-button items-center text-2xl lg:hidden cursor-pointer z-30"
            >
              ☰
            </label>
            <ul className="hidden font-light lg:flex space-x-4 lg:space-x-16">
              <li className={isActive("/")}>
                <Link href="/" className="cursor-pointer hover:text-[#FF10F0]">
                  HOME
                </Link>
              </li>
              <li className={isActive("/mint")}>
                <Link
                  href="/mint"
                  className="cursor-pointer hover:text-[#FF10F0]"
                >
                  MINT
                </Link>
              </li>
              {/* <li className={isActive("/bridge")}>
                <Link
                  href="/bridge"
                  className="cursor-pointer hover:text-[#FF10F0]"
                >
                  BRIDGE
                </Link>
              </li> */}
              <li className={isActive("/nfts")}>
                <Link
                  href="/nfts"
                  className="cursor-pointer hover:text-[#FF10F0]"
                >
                  NFTS
                </Link>
              </li>
            </ul>
          </div>
          <ConnectButton
            label="Connect Wallet"
            accountStatus="address"
            chainStatus="icon"
          />
        </div>
      )}
      <div className="drawer-side z-20">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-black text-base-content pt-20 min-h-full w-2/3 p-5 border-r-0.5px]">
          <li className={isActiveSide("/")}>
            <Link href="/" className="cursor-pointer hover:text-[#FF10F0]">
              HOME
            </Link>
          </li>
          <li className={isActiveSide("/mint")}>
            <Link href="/mint" className="cursor-pointer hover:text-[#FF10F0]">
              MINT
            </Link>
          </li>
          {/* <li className={isActiveSide("/bridge")}>
            <Link
              href="/bridge"
              className="cursor-pointer hover:text-[#FF10F0]"
            >
              BRIDGE
            </Link>
          </li> */}
          <li className={isActiveSide("/nfts")}>
            <Link href="/nfts" className="cursor-pointer hover:text-[#FF10F0]">
              NFTS
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
