// UW Campus Waste Dataset Contribution Helper
// Enables opt-in anonymous scan image submission to Vercel Blob Free Tier

const OPT_IN_STORAGE_KEY = "onebin_dataset_opt_in";

export function isDatasetOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(OPT_IN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDatasetOptIn(enabled: boolean): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(OPT_IN_STORAGE_KEY, enabled ? "true" : "false");
    } catch {
      // ignore
    }
  }
}

export async function uploadDatasetContribution(data: {
  imageBase64: string;
  bin: string;
  item: string;
  confidence: number;
}): Promise<{ success: boolean; url?: string; simulated?: boolean }> {
  try {
    const res = await fetch("/api/contribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch {
    return { success: false };
  }
}
