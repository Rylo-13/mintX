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
    return pathname === path ? "text-[#FF10F0]" : "text-white";
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
    <div className="sticky top-0 h-16 mx-auto px-12 bg-black flex justify-between items-center border-b-2 border-[#FF10F0] z-10">
      {initialized && (
        <>
          <ul className="text-lg flex space-x-16">
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
            <li className={isActive("/bridge")}>
              <Link
                href="/bridge"
                className="cursor-pointer hover:text-[#FF10F0]"
              >
                BRIDGE
              </Link>
            </li>
            <li className={isActive("/nfts")}>
              <Link
                href="/nfts"
                className="cursor-pointer hover:text-[#FF10F0]"
              >
                NFTS
              </Link>
            </li>
          </ul>
          <ConnectButton
            label="Connect Wallet"
            accountStatus="address"
            chainStatus="icon"
          />
        </>
      )}
    </div>
  );
};

export default Navbar;
