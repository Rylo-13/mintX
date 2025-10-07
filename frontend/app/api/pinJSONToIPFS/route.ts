// app/api/pinJSONToIPFS/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Missing Pinata API credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const metadata = await request.json();

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error pinning JSON to IPFS:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      {
        error: "Error pinning JSON to IPFS",
        details: error?.response?.data?.error || error?.message
      },
      { status: 500 }
    );
  }
}
