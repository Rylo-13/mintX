import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, formData } = await req.json();

    const pinataResponse = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
      },
    });

    return NextResponse.json(pinataResponse.data);
  } catch (error) {
    console.error("Error proxying request to Pinata:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to Pinata" },
      { status: 500 }
    );
  }
}
