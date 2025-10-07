import { NextRequest, NextResponse } from "next/server";

// Increase timeout for OpenAI image generation (up to 60s on hobby plan)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { aiImageDescription } = await req.json();

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
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to generate image",
          details: errorData.error?.message || "Unknown OpenAI error",
          status: response.status
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    return NextResponse.json({ imageUrl: responseData.data[0].url });
  } catch (error: any) {
    console.error("Error generating image:", error?.message || error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
