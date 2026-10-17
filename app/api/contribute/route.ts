import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, bin, item, confidence } = body;

    if (!imageBase64 || !bin || !item) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // If Vercel Blob token is configured, upload to Vercel Blob store
    if (token) {
      try {
        const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(imageBase64, "base64");
        const filename = `uw-dataset/${bin}/${Date.now()}-${item.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;

        const blobRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-content-type": "image/jpeg",
            "x-add-random-suffix": "true",
          },
          body: buffer,
        });

        if (blobRes.ok) {
          const blobData = await blobRes.json();
          return NextResponse.json({
            success: true,
            url: blobData.url,
            simulated: false,
          });
        }
      } catch (uploadErr) {
        console.warn("[Vercel Blob] Upload failed:", uploadErr);
      }
    }

    // Graceful zero-config fallback (simulated local acknowledgement)
    return NextResponse.json({
      success: true,
      simulated: true,
      message: "Contribution acknowledged. Connect BLOB_READ_WRITE_TOKEN for direct Vercel Blob storage.",
      record: {
        bin,
        item,
        confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
