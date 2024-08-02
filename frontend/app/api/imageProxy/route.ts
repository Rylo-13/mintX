// app/api/imageProxy/route.ts
import type { NextApiRequest, NextApiResponse } from "next";

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const imageUrl = req.query.url as string;

  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageBase64 = imageBuffer.toString("base64");
    const mimeType = response.headers.get("Content-Type") || "image/png";

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      image: `data:${mimeType};base64,${imageBase64}`,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching image" });
  }
}
