import { NextRequest, NextResponse } from "next/server";
import { classifyWasteImage } from "@/lib/gemini";
import type { ClassifyErrorResponse, ClassifyRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: Partial<ClassifyRequest>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ClassifyErrorResponse>(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { image, mimeType } = body;
    if (!image || typeof image !== "string" || image.trim().length === 0) {
      return NextResponse.json<ClassifyErrorResponse>(
        { error: "Missing or invalid 'image' property. A base64 image string is required." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<ClassifyErrorResponse>(
        {
          error: "Gemini API key is not configured.",
          details: "Set the GEMINI_API_KEY environment variable on the server or in Vercel project settings.",
        },
        { status: 500 }
      );
    }

    const result = await classifyWasteImage(image, mimeType || "image/jpeg");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[OneBin Classify API] Error processing classification request:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json<ClassifyErrorResponse>(
      {
        error: "Failed to classify image.",
        details: message,
      },
      { status: 500 }
    );
  }
}
