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
  } catch (error: unknown) {
    // Log full error details server-side
    if (axios.isAxiosError(error)) {
      console.error("Error pinning JSON to IPFS:", error.response?.data || error.message);
    } else {
      console.error("Error pinning JSON to IPFS:", error instanceof Error ? error.message : String(error));
    }

    // Return generic error to client
    return NextResponse.json(
      { error: "Failed to upload metadata. Please try again." },
      { status: 500 }
    );
  }
}
