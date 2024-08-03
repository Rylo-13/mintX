import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
        },
      }
    );

    const { IpfsHash } = response.data;
    return NextResponse.json({ IpfsHash });
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return NextResponse.json(
      { error: "Error uploading to Pinata" },
      { status: 500 }
    );
  }
};
