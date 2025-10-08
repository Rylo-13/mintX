import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();

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

    // Validate uploaded file
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

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

    const { IpfsHash } = response.data;
    return NextResponse.json({ IpfsHash });
  } catch (error: unknown) {
    // Log full error details server-side
    if (axios.isAxiosError(error)) {
      console.error("Error uploading to Pinata:", error.response?.data || error.message);
    } else {
      console.error("Error uploading to Pinata:", error instanceof Error ? error.message : String(error));
    }

    // Return generic error to client
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
};
