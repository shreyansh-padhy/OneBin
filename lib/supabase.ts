// OneBin Sustainability Impact & Scan Telemetry
// Dual-layer: logs locally via localStorage and optionally syncs with Supabase free-tier REST API.

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
  }

  // 2. Supabase Free Tier REST Sync (if configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/scans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          bin: fullEvent.bin,
          item: fullEvent.item,
          confidence: fullEvent.confidence,
          ms: fullEvent.ms,
          created_at: fullEvent.timestamp,
        }),
      });
    } catch (err) {
      console.warn("[OneBin Telemetry] Supabase sync skipped:", err);
    }
  }
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
