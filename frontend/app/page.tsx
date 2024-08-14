"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RippleButton from "@/components/Buttons/RippleButton";
import Image from "next/image";

const Home: React.FC = () => {
  const navigate = useRouter();

  const handleNavigate = () => {
    navigate.push("/mint");
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center welcomeContent">
      <Image
        // src="/distorted.svg"
        // src="/distorted2.svg"
        src="/distorted3.svg"
        alt="Background"
        fill
        quality={100}
        className="object-cover z-0 opacity-90"
      />
      <div className="z-10 w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto text-center bg-black bg-opacity-75 mb-16 py-8 sm:py-12 md:py-16 px-8 sm:px-12 md:px-16 rounded-lg">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-10 text-[#FF10F0]">
          {/* Welcome To Crypto Canvas */}
          Welcome To MintX
        </h1>
        <p className="text-base sm:text-lg md:text-xl my-6 sm:my-8 md:my-10 px-4 sm:px-6 md:px-10 font-light justify-evenly text-white">
          Unleash your creativity by uploading your own art or generate unique
          pieces with the help of AI. Turn your creations into NFTs and enjoy
          the freedom of transferring them across multiple blockchains.
        </p>
        <div className="mt-6 sm:mt-8 md:mt-10">
          <RippleButton text="Enter" active onClick={handleNavigate} />
        </div>
      </div>
    </div>
  );
};

export default Home;
