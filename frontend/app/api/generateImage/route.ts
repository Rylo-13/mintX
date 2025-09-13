import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { aiImageDescription } = await req.json();

    const requestData = {
      model: "dall-e-2",
      prompt: aiImageDescription,
      n: 1,
      size: "256x256",
      // size: "512x512",
      // size: "1024x1024",
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();

    return NextResponse.json({ imageUrl: responseData.data[0].url });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
