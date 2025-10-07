// app/api/pinFileToIPFS/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;

    console.log("API Key exists:", !!apiKey);
    console.log("API Secret exists:", !!apiSecret);

    if (!apiKey || !apiSecret) {
      console.error("Missing Pinata API credentials");
      return NextResponse.json(
        {
          error: "Server configuration error",
          debug: {
            hasApiKey: !!apiKey,
            hasApiSecret: !!apiSecret
          }
        },
        { status: 500 }
      );
    }

    const formData = new FormData();
    const file = await request.arrayBuffer();
    formData.append("file", new Blob([file]), "image.png");

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error pinning file to IPFS:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      {
        error: "Error pinning file to IPFS",
        details: error?.response?.data?.error || error?.message
      },
      { status: 500 }
    );
  }
}
