// app/api/pinJSONToIPFS/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const metadata = await request.json(); // Parse JSON metadata from request

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error pinning JSON to IPFS:", error);
    return NextResponse.json(
      { error: "Error pinning JSON to IPFS" },
      { status: 500 }
    );
  }
}
