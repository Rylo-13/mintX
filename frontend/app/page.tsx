"use client";
import React from "react";
import { useRouter } from "next/navigation";
import RippleButton from "@/components/Buttons/RippleButton";

const Home: React.FC = () => {
  const navigate = useRouter();

  const handleNavigate = () => {
    navigate.push("/mint");
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center indexContent"
      style={{
        backgroundImage: "url('/distorted.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
      }}
    >
      <div className="w-1/2 mx-auto text-center bg-black bg-opacity-75 mb-16 py-16 px-16 rounded-lg">
        <h1 className="text-5xl font-bold mb-10 text-[#FF10F0]">
          Welcome To Crypto Canvas
        </h1>
        <p className="text-lg my-10 px-10 font-light justify-evenly text-white">
          Unleash your creativity by uploading your own art or generate unique
          pieces with the help of AI. Turn your creations into NFTs and enjoy
          the freedom of transferring them across multiple blockchains.
        </p>
        <div className="mt-10">
          <RippleButton text="Enter" active onClick={handleNavigate} />
        </div>
      </div>
    </div>
  );
};

export default Home;
