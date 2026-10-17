import { NextResponse } from "next/server";
import { MUNICIPALITIES, type Municipality } from "@/lib/rules";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const munParam = searchParams.get("municipality") as Municipality | null;
  const munKey = munParam && MUNICIPALITIES[munParam] ? munParam : "seattle";

  const defaultRules = MUNICIPALITIES[munKey];

  // Optional: Vercel Edge Config lookup if EDGE_CONFIG environment variable is present
  const edgeConfigUrl = process.env.EDGE_CONFIG;
  if (edgeConfigUrl) {
    try {
      const res = await fetch(`${edgeConfigUrl}/item/rules_${munKey}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const edgeData = await res.json();
        return NextResponse.json({
          ...defaultRules,
          ...edgeData,
          source: "vercel_edge_config",
        });
      }
    } catch {
      // Fallback cleanly to built-in rules
    }
  }

  return NextResponse.json({
    ...defaultRules,
    source: "static_edge",
  });
}
