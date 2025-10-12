"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RippleButton from "@/components/ui/Buttons/RippleButton";

const Home: React.FC = () => {
  const navigate = useRouter();

  const handleNavigate = () => {
    navigate.push("/mint");
  };

  return (
    <main
      className="relative flex items-center justify-center"
      style={{ height: "calc(100vh - 5rem)" }}
    >
      <div className="z-10 w-full max-w-3xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="bg-[#1A1A1A] rounded-3xl p-10 md:p-14 shadow-xl border border-white/10">
          <header className="mb-10">
            <h1 className="text-5xl md:text-6xl font-light mb-5 text-white tracking-tight">
              Welcome to MintX
            </h1>
            <p className="text-base text-gray-400 leading-relaxed mb-3 font-light">
              Unleash your creativity by uploading your own art or generate
              unique pieces with the help of AI.
            </p>
            <p className="text-base text-gray-400 leading-relaxed font-light">
              Turn your creations into NFTs and enjoy the freedom of
              transferring them across multiple blockchains.
            </p>
          </header>

          <RippleButton
            text="Get Started"
            active
            onClick={handleNavigate}
            className="w-full text-sm py-2.5 font-light"
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
