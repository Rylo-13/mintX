"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RippleButton from "@/components/ui/Buttons/RippleButton";
import Image from "next/image";

const Home: React.FC = () => {
  const navigate = useRouter();

  const handleNavigate = () => {
    navigate.push("/mint");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center welcomeContent">
      <Image
        src="/distorted3.svg"
        alt="Abstract background pattern"
        fill
        quality={100}
        priority
        className="object-cover z-0 opacity-90"
      />
      <section className="z-10 max-w-4xl mx-auto text-center bg-black/80 backdrop-blur-sm p-8 md:p-16 rounded-lg shadow-2xl">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#FF10F0]">
            Welcome To MintX
          </h1>
        </header>
        <div className="space-y-6 mb-10">
          <p className="text-lg md:text-xl font-light text-white leading-relaxed">
            Unleash your creativity by uploading your own art or generate unique
            pieces with the help of AI.
          </p>
          <p className="text-lg md:text-xl font-light text-white leading-relaxed">
            Turn your creations into NFTs and enjoy the freedom of transferring
            them across multiple blockchains.
          </p>
        </div>
        <RippleButton 
          text="Enter" 
          active 
          onClick={handleNavigate}
          className="text-lg px-8 py-3"
        />
      </section>
    </main>
  );
};

export default Home;
