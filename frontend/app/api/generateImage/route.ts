import { NextRequest, NextResponse } from "next/server";

// Increase timeout for OpenAI image generation (up to 60s on hobby plan)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { aiImageDescription } = await req.json();

    // Basic validation to prevent abuse
    if (!aiImageDescription || typeof aiImageDescription !== 'string' || aiImageDescription.trim().length === 0 || aiImageDescription.length > 1000) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OpenAI API key");
      return NextResponse.json(
        { error: "Server configuration error: Missing API key" },
        { status: 500 }
      );
    }

    const requestData = {
      model: "dall-e-2",
      prompt: aiImageDescription,
      n: 1,
      size: "256x256",
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      // Log full error details server-side for debugging
      console.error("OpenAI API error:", JSON.stringify(errorData));

      // Return generic error to client (no internal details)
      return NextResponse.json(
        { error: "Failed to generate image. Please try again." },
        { status: 500 }
      );
    }

    const responseData = await response.json();

    return NextResponse.json({ imageUrl: responseData.data[0].url });
  } catch (error: unknown) {
    // Log full error server-side (stack trace, details, etc.)
    console.error("Error generating image:", error instanceof Error ? error.message : String(error));

    // Return generic error to client
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
