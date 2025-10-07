import React from "react";
import Image from "next/image";

const EthereumIcon = () => (
  <div className="w-7 h-7 bg-[#ffffff] rounded-full flex items-center justify-center">
    <Image src="/Ethereum.svg" alt="Ethereum" width={25} height={25} />
  </div>
);

export default EthereumIcon;
