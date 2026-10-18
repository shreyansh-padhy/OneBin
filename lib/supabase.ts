// OneBin Sustainability Impact & Scan Telemetry
// Dual-layer: logs locally via localStorage, BroadcastChannel for zero-latency screen syncing,
// and syncs with Supabase PostgreSQL & Storage via @supabase/supabase-js SDK.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ScanEvent {
  id?: string;
  bin: string;
  item: string;
  confidence: number;
  timestamp: string;
  ms?: number;
}

export interface ImpactStats {
  totalScans: number;
  compostCount: number;
  recyclingCount: number;
  trashCount: number;
  diversionRate: number; // percentage (0 - 100)
  co2SavedKg: number; // estimated kg CO2 prevented from landfill
}

const STORAGE_KEY = "onebin_scan_history";
const MAX_LOCAL_EVENTS = 100;
const CHANNEL_NAME = "onebin_live_scans";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function getLocalScanHistory(): ScanEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function logScanEvent(event: {
  bin: string;
  item: string;
  confidence: number;
  ms?: number;
}): Promise<void> {
  const fullEvent: ScanEvent = {
    ...event,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    timestamp: new Date().toISOString(),
  };

  // 1. Local Storage persistence
  if (typeof window !== "undefined") {
    try {
      const history = getLocalScanHistory();
      const updated = [fullEvent, ...history].slice(0, MAX_LOCAL_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("[OneBin Telemetry] Failed to write localStorage:", err);
    }

    // 2. BroadcastChannel for instant zero-latency cross-tab/stage display syncing
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage(fullEvent);
        bc.close();
      }
      window.dispatchEvent(new CustomEvent("onebin:scan", { detail: fullEvent }));
    } catch (err) {
      console.warn("[OneBin Telemetry] Broadcast failed:", err);
    }
  }

  // 3. Supabase SDK Database Sync (if configured via Vercel integration or .env)
  if (supabase) {
    try {
      await supabase.from("scans").insert({
        bin: fullEvent.bin,
        item: fullEvent.item,
        confidence: fullEvent.confidence,
        ms: fullEvent.ms,
        created_at: fullEvent.timestamp,
      });
    } catch (err) {
      console.warn("[OneBin Telemetry] Supabase sync skipped:", err);
    }
  }
}

export function subscribeToLiveScans(onScan: (event: ScanEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};

  // BroadcastChannel listener (cross-tab on same device or presentation screen)
  let bc: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (msg) => {
      if (msg.data) onScan(msg.data);
    };
  }

  // In-tab CustomEvent listener
  const customHandler = (e: Event) => {
    const ce = e as CustomEvent<ScanEvent>;
    if (ce.detail) onScan(ce.detail);
  };
  window.addEventListener("onebin:scan", customHandler);

  // Storage event listener (fires when other tabs update localStorage)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onScan(parsed[0]);
        }
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("onebin:scan", customHandler);
    window.removeEventListener("storage", storageHandler);
  };
}

export async function fetchRecentScans(): Promise<ScanEvent[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data && !error) {
        return data.map((r: { id: string; bin: string; item: string; confidence: number; created_at: string; ms?: number }) => ({
          id: r.id,
          bin: r.bin,
          item: r.item,
          confidence: r.confidence,
          timestamp: r.created_at,
          ms: r.ms,
        }));
      }
    } catch (err) {
      console.warn("[OneBin Telemetry] Supabase fetch failed, falling back to local:", err);
    }
  }

  return getLocalScanHistory();
}

export function computeImpactStats(history: ScanEvent[]): ImpactStats {
  const totalScans = history.length;
  if (totalScans === 0) {
    return {
      totalScans: 0,
      compostCount: 0,
      recyclingCount: 0,
      trashCount: 0,
      diversionRate: 0,
      co2SavedKg: 0,
    };
  }

  let compostCount = 0;
  let recyclingCount = 0;
  let trashCount = 0;

  for (const ev of history) {
    if (ev.bin === "compost") compostCount++;
    else if (ev.bin === "recycling") recyclingCount++;
    else trashCount++;
  }

  const diverted = compostCount + recyclingCount;
  const diversionRate = Math.round((diverted / totalScans) * 100);

  // EPA WARM diversion heuristics: ~0.8kg CO2e per composted organic, ~0.5kg CO2e per recycled item
  const co2SavedKg = Math.round((compostCount * 0.8 + recyclingCount * 0.5) * 10) / 10;

  return {
    totalScans,
    compostCount,
    recyclingCount,
    trashCount,
    diversionRate,
    co2SavedKg,
  };
}

// ---------------------------------------------------------------------------
// Human-in-the-Loop Dataset Collection & User Feedback
// ---------------------------------------------------------------------------

export interface DatasetFeedback {
  photoBase64?: string;
  predictedItem: string;
  predictedBin: string;
  confidence: number;
  userConfirmed: boolean;
  correctedBin?: string;
  correctedItem?: string;
  consentGranted: boolean;
}

const DATASET_STORAGE_KEY = "onebin_user_dataset_samples";

export function getLocalDatasetSamples(): DatasetFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DATASET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Uploads a user-consented photo and classification ground-truth to Supabase Storage
 * ('waste-dataset' bucket) and records the metadata in the database.
 */
export async function submitDatasetFeedback(feedback: DatasetFeedback): Promise<{ success: boolean; message: string; url?: string }> {
  if (!feedback.consentGranted) {
    return { success: false, message: "User consent not granted. Skipped upload." };
  }

  const finalBin = feedback.userConfirmed ? feedback.predictedBin : (feedback.correctedBin || feedback.predictedBin);
  const finalItem = feedback.userConfirmed ? feedback.predictedItem : (feedback.correctedItem || feedback.predictedItem);

  // 1. Save locally to localStorage
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalDatasetSamples();
      const updated = [{ ...feedback, timestamp: new Date().toISOString() }, ...existing].slice(0, 50);
      localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("[OneBin Dataset] Failed to save sample locally:", e);
    }
  }

  let publicUrl: string | undefined = undefined;

  // 2. Upload photo to Supabase Storage & record metadata if configured
  if (supabase && feedback.photoBase64) {
    try {
      const matches = feedback.photoBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : feedback.photoBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const cleanItem = finalItem.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const filename = `${finalBin}/${Date.now()}-${cleanItem}.jpg`;

      // Upload to 'waste-dataset' bucket via Supabase SDK
      const { error: uploadErr } = await supabase.storage
        .from("waste-dataset")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("waste-dataset")
          .getPublicUrl(filename);
        publicUrl = urlData.publicUrl;
      }

      // 3. Record metadata in scans table
      await supabase.from("scans").insert({
        bin: finalBin,
        item: finalItem,
        confidence: feedback.confidence,
        image_url: publicUrl,
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: feedback.userConfirmed
          ? "Confirmed! Added to verified dataset."
          : `Correction recorded: Marked as ${finalBin.toUpperCase()} (${finalItem}). Added to dataset.`,
        url: publicUrl,
      };
    } catch (err) {
      console.warn("[OneBin Dataset] Supabase upload failed, falling back to local:", err);
    }
  }

  return {
    success: true,
    message: feedback.userConfirmed
      ? "Confirmed! Saved locally to dataset."
      : `Correction recorded: Marked as ${finalBin.toUpperCase()}. Saved locally.`,
  };
}
