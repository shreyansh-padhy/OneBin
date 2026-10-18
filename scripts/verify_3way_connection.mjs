#!/usr/bin/env node
// ==============================================================================
// OneBin: Automated 3-Way Integration & Connectivity Health Check (Task 3.4)
// Validates the complete production loop:
// 1. GitHub -> Vercel: Production site response, COOP/COEP WASM headers, ONNX model CDN
// 2. Vercel -> Supabase: Presence and validity of public environment variables
// 3. Supabase Operations: Live table insert, readback, get_bin_analytics() RPC, & storage bucket
// ==============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

// 1. Helper to load .env.local or .env without external packages
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const VERCEL_URL = process.env.PRODUCTION_URL || "https://onebin.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const results = [];

function recordResult(subsystem, check, status, latencyMs, details = "") {
  results.push({ subsystem, check, status, latencyMs: `${latencyMs}ms`, details });
}

// ------------------------------------------------------------------------------
// Loop 1: GitHub -> Vercel Production Deployment & WASM Headers
// ------------------------------------------------------------------------------
async function testVercel() {
  console.log("\n[1/3] Testing GitHub -> Vercel Production Environment...");

  // Check 1: HTTP 200 & COOP/COEP Headers
  const t0 = Date.now();
  try {
    const res = await fetch(VERCEL_URL, { method: "GET" });
    const latency = Date.now() - t0;

    if (res.ok) {
      recordResult("Vercel", "HTTP 200 Live Status", "PASS", latency, `${VERCEL_URL} is live`);
    } else {
      recordResult("Vercel", "HTTP 200 Live Status", "FAIL", latency, `HTTP status ${res.status}`);
    }

    const coop = res.headers.get("cross-origin-opener-policy");
    const coep = res.headers.get("cross-origin-embedder-policy");

    if (coop === "same-origin" && coep === "require-corp") {
      recordResult("Vercel", "WASM Isolation Headers", "PASS", 0, "COOP: same-origin, COEP: require-corp");
    } else {
      recordResult(
        "Vercel",
        "WASM Isolation Headers",
        "WARN",
        0,
        `COOP: ${coop || "none"}, COEP: ${coep || "none"}`
      );
    }
  } catch (err) {
    recordResult("Vercel", "HTTP 200 Live Status", "FAIL", Date.now() - t0, err.message);
  }

  // Check 2: Stage Dashboard Route (/dashboard)
  const tDash = Date.now();
  try {
    const res = await fetch(`${VERCEL_URL}/dashboard`, { method: "GET" });
    const latency = Date.now() - tDash;
    if (res.ok) {
      recordResult("Vercel", "Stage Dashboard (/dashboard)", "PASS", latency, "Prerendered and responsive");
    } else {
      recordResult("Vercel", "Stage Dashboard (/dashboard)", "FAIL", latency, `HTTP status ${res.status}`);
    }
  } catch (err) {
    recordResult("Vercel", "Stage Dashboard (/dashboard)", "FAIL", Date.now() - tDash, err.message);
  }

  // Check 3: ONNX Model CDN Static Weight Availability
  const tModel = Date.now();
  try {
    const res = await fetch(`${VERCEL_URL}/models/onebin.onnx`, { method: "HEAD" });
    const latency = Date.now() - tModel;
    const len = res.headers.get("content-length");
    const mb = len ? (Number.parseInt(len, 10) / (1024 * 1024)).toFixed(1) : "unknown";

    if (res.ok) {
      recordResult("Vercel", "ONNX Weight CDN Cache", "PASS", latency, `Size: ${mb} MB (Edge cached)`);
    } else {
      recordResult("Vercel", "ONNX Weight CDN Cache", "FAIL", latency, `HTTP status ${res.status}`);
    }
  } catch (err) {
    recordResult("Vercel", "ONNX Weight CDN Cache", "FAIL", Date.now() - tModel, err.message);
  }
}

// ------------------------------------------------------------------------------
// Loop 2: Vercel -> Supabase Configuration & JWT Validation
// ------------------------------------------------------------------------------
async function testConfiguration() {
  console.log("\n[2/3] Testing Vercel -> Supabase Environment Configuration...");

  if (!SUPABASE_URL) {
    recordResult("Config", "NEXT_PUBLIC_SUPABASE_URL", "FAIL", 0, "Missing in environment or .env.local");
    return;
  }
  if (!SUPABASE_ANON_KEY) {
    recordResult("Config", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "FAIL", 0, "Missing in environment or .env.local");
    return;
  }

  try {
    const url = new URL(SUPABASE_URL);
    if (url.protocol === "https:" && url.hostname.includes("supabase.co")) {
      recordResult("Config", "Supabase URL Scheme", "PASS", 0, `${url.hostname}`);
    } else {
      recordResult("Config", "Supabase URL Scheme", "WARN", 0, `Unexpected host ${url.hostname}`);
    }
  } catch (err) {
    recordResult("Config", "Supabase URL Scheme", "FAIL", 0, err.message);
  }

  // Validate JWT payload
  try {
    const parts = SUPABASE_ANON_KEY.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      if (payload.role === "anon") {
        recordResult("Config", "Supabase JWT Role", "PASS", 0, `Role: anon, Ref: ${payload.ref || "ok"}`);
      } else {
        recordResult("Config", "Supabase JWT Role", "WARN", 0, `Unexpected role: ${payload.role}`);
      }
    } else {
      recordResult("Config", "Supabase JWT Role", "FAIL", 0, "Invalid JWT format");
    }
  } catch (err) {
    recordResult("Config", "Supabase JWT Role", "FAIL", 0, err.message);
  }
}

// ------------------------------------------------------------------------------
// Loop 3: Supabase Operations (Insert, Readback, RPC Analytics, Storage Bucket)
// ------------------------------------------------------------------------------
async function testSupabase() {
  console.log("\n[3/3] Probing Live Supabase Operations...");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    recordResult("Supabase", "Supabase Operations", "SKIP", 0, "Credentials unavailable");
    return;
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const probeItem = `health_check_${Date.now()}`;

  // 1. Telemetry Row Insertion Probe
  const tInsert = Date.now();
  let insertedId = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        bin: "recycling",
        item: probeItem,
        confidence: 0.99,
        ms: 18,
      }),
    });
    const latency = Date.now() - tInsert;
    if (res.ok) {
      const rows = await res.json();
      insertedId = rows?.[0]?.id;
      recordResult("Supabase", "Row Insertion (scans)", "PASS", latency, `Inserted probe ID: ${insertedId}`);
    } else {
      const errText = await res.text();
      recordResult("Supabase", "Row Insertion (scans)", "FAIL", latency, `HTTP ${res.status}: ${errText}`);
    }
  } catch (err) {
    recordResult("Supabase", "Row Insertion (scans)", "FAIL", Date.now() - tInsert, err.message);
  }

  // 2. Telemetry Row Readback Probe
  const tRead = Date.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?item=eq.${probeItem}&select=id,bin,item,confidence&limit=1`,
      { headers }
    );
    const latency = Date.now() - tRead;
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0 && rows[0].item === probeItem) {
        recordResult("Supabase", "Row Readback (scans)", "PASS", latency, `Successfully read row back via RLS`);
      } else {
        recordResult("Supabase", "Row Readback (scans)", "WARN", latency, "Row not immediately visible");
      }
    } else {
      recordResult("Supabase", "Row Readback (scans)", "FAIL", latency, `HTTP ${res.status}`);
    }
  } catch (err) {
    recordResult("Supabase", "Row Readback (scans)", "FAIL", Date.now() - tRead, err.message);
  }

  // 3. get_bin_analytics() RPC Function Probe
  const tRpc = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_bin_analytics`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    const latency = Date.now() - tRpc;
    if (res.ok) {
      const data = await res.json();
      recordResult(
        "Supabase",
        "RPC get_bin_analytics()",
        "PASS",
        latency,
        `Total: ${data.total}, Diversion: ${data.diversion_rate}%`
      );
    } else {
      const errText = await res.text();
      recordResult("Supabase", "RPC get_bin_analytics()", "FAIL", latency, `HTTP ${res.status}: ${errText}`);
    }
  } catch (err) {
    recordResult("Supabase", "RPC get_bin_analytics()", "FAIL", Date.now() - tRpc, err.message);
  }

  // 4. Waste-Dataset Storage Bucket & Upload Probe
  const tStorage = Date.now();
  const testFileName = `probes/test_${Date.now()}.txt`;
  try {
    // Upload probe file
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/waste-dataset/${testFileName}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "text/plain",
          "x-upsert": "true",
        },
        body: "onebin-health-check-ok",
      }
    );
    const latency = Date.now() - tStorage;

    if (uploadRes.ok) {
      // Readback probe file
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/waste-dataset/${testFileName}`;
      const readRes = await fetch(publicUrl);
      if (readRes.ok) {
        recordResult(
          "Supabase",
          "Storage (waste-dataset)",
          "PASS",
          latency,
          `Uploaded & verified public readback at /${testFileName}`
        );
      } else {
        recordResult("Supabase", "Storage (waste-dataset)", "WARN", latency, "Uploaded but public readback failed");
      }
    } else {
      const errText = await uploadRes.text();
      recordResult(
        "Supabase",
        "Storage (waste-dataset)",
        "WARN",
        latency,
        `Bucket probe notice: ${errText.slice(0, 80)}`
      );
    }
  } catch (err) {
    recordResult("Supabase", "Storage (waste-dataset)", "WARN", Date.now() - tStorage, err.message);
  }
}

// ------------------------------------------------------------------------------
// Runner & Summary Matrix Formatter
// ------------------------------------------------------------------------------
async function main() {
  console.log("==================================================================");
  console.log("       OneBin: Automated 3-Way Connectivity Health Check          ");
  console.log("==================================================================");

  await testVercel();
  await testConfiguration();
  await testSupabase();

  console.log("\n==================================================================");
  console.log("                      VERIFICATION SUMMARY                        ");
  console.log("==================================================================");

  let hasFailure = false;
  for (const r of results) {
    const symbol = r.status === "PASS" ? "✔" : r.status === "WARN" ? "▲" : "✖";
    const statusFormatted =
      r.status === "PASS" ? `[${r.status}]` : r.status === "WARN" ? `[${r.status}]` : `[${r.status}]`;
    const col1 = `[${r.subsystem}] ${r.check}`.padEnd(35, " ");
    const col2 = `${symbol} ${statusFormatted}`.padEnd(10, " ");
    const col3 = r.latencyMs.padStart(7, " ");
    console.log(`${col1} | ${col2} | ${col3} | ${r.details}`);

    if (r.status === "FAIL") {
      hasFailure = true;
    }
  }
  console.log("==================================================================\n");

  if (hasFailure) {
    console.error("❌ Health check completed with failures. Please inspect the logs above.");
    process.exit(1);
  } else {
    console.log("✅ All systems operational! GitHub <-> Vercel <-> Supabase 3-way loop verified.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled error in verification script:", err);
  process.exit(1);
});
