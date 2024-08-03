// app/api/pinFileToIPFS/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const formData = new FormData();
    const file = await request.arrayBuffer(); // Get file data from request
    formData.append("file", new Blob([file]), "image.png");

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

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error pinning file to IPFS:", error);
    return NextResponse.json(
      { error: "Error pinning file to IPFS" },
      { status: 500 }
    );
  }
}
