// app/api/pinFileToIPFS/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Maximum file size: 10MB (same as frontend validation)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File signature validation (magic bytes)
function validateImageSignature(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return true;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }

  return false;
}

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

    // Get file as ArrayBuffer
    const fileBuffer = await request.arrayBuffer();

    // Validate file size
    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file is actually an image by checking magic bytes
    if (!validateImageSignature(fileBuffer)) {
      return NextResponse.json(
        { error: "Invalid image file" },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), "image.png");

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
  } catch (error: unknown) {
    // Log full error details server-side
    if (axios.isAxiosError(error)) {
      console.error("Error pinning file to IPFS:", error.response?.data || error.message);
    } else {
      console.error("Error pinning file to IPFS:", error instanceof Error ? error.message : String(error));
    }

    // Return generic error to client
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}
