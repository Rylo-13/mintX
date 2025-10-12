import { NextResponse } from "next/server";
import axios from "axios";

// Whitelist of allowed domains for SSRF protection
const ALLOWED_DOMAINS = [
  "oaidalleapiprodscus.blob.core.windows.net",
  "gold-bizarre-wildebeest-656.mypinata.cloud",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("imageUrl");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image URL is required" },
      { status: 400 }
    );
  }

  try {
    // Parse and validate URL
    const url = new URL(imageUrl);

    // Only allow HTTPS
    if (url.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    // Check if domain is whitelisted
    const isAllowed = ALLOWED_DOMAINS.some((domain) => url.hostname === domain);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    // Fetch with timeout to prevent hanging
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000, // 10 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    // Validate content type is an image
    const contentType = response.headers["content-type"];
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL must return an image" },
        { status: 400 }
      );
    }

    return new Response(response.data, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);

    // Don't expose internal error details
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return NextResponse.json({ error: "Request timeout" }, { status: 408 });
    }

    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
