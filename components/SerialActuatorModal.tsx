"use client";

import { CheckCircle2, Cpu, ExternalLink, Play, Power, RotateCcw, X, Zap } from "lucide-react";
import { useState } from "react";
import {
  connectSerial,
  disconnectSerial,
  isSerialConnected,
  isSerialSupported,
  sendBinCommand,
} from "@/lib/serial";

export default function SerialActuatorModal({ onClose }: { onClose: () => void }) {
  const [connected, setConnected] = useState(isSerialConnected());
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Ready. Connect your Arduino or ESP32 over USB at 9600 baud.",
  ]);
  const [lastLid, setLastLid] = useState<string | null>(null);

  function log(msg: string) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
  }

  async function handleToggleConnect() {
    if (!isSerialSupported()) {
      log("Error: Web Serial API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    setBusy(true);
    if (connected) {
      await disconnectSerial();
      setConnected(false);
      log("Disconnected from serial port.");
    } else {
      try {
        log("Opening Web Serial port selector...");
        await connectSerial(9600);
        setConnected(true);
        log("Connected successfully! Baud rate: 9600.");
      } catch (err) {
        log(`Connection failed or cancelled: ${(err as Error).message}`);
      }
    }
    setBusy(false);
  }

  async function triggerLid(bin: string, label: string) {
    if (!connected) {
      log("Cannot actuate: Serial port is not connected.");
      return;
    }
    setLastLid(label);
    const success = await sendBinCommand(bin);
    if (success) {
      log(`Actuation sent: Open ${label} Lid (${bin === "compost" ? "'C'" : bin === "recycling" ? "'R'" : "'T'"})`);
    } else {
      log(`Failed to transmit command for ${label}.`);
    }
  }

  async function closeAll() {
    if (!connected) return;
    setLastLid("Closed All");
    const success = await sendBinCommand("close_all");
    if (success) {
      log("Actuation sent: Close all lids ('X')");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-lg">Smart Bin IoT Actuator</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Connection Status Panel */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hardware Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <p className="font-bold text-slate-900 text-sm">
                    {connected ? "Arduino / ESP32 Connected" : "Microcontroller Disconnected"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleConnect}
                disabled={busy}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all ${
                  connected
                    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                {connected ? "Disconnect" : "Connect Port"}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Web Serial links directly to your microcontroller via USB or Bluetooth at 9600 baud.
            </p>
          </div>

          {/* Manual Actuation Test Triggers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Manual Lid Actuation Test</p>
              {lastLid && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Last: {lastLid}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerLid("compost", "Compost")}
                disabled={!connected}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-emerald-900 shadow-sm hover:bg-emerald-100 disabled:opacity-40 transition-colors"
              >
                <span className="text-lg">🟢</span>
                <span className="text-xs font-bold">Compost</span>
                <span className="text-[10px] text-emerald-700">Pin 9 (&apos;C&apos;)</span>
              </button>

              <button
                type="button"
                onClick={() => triggerLid("recycling", "Recycling")}
                disabled={!connected}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-300 bg-blue-50/70 p-3 text-blue-900 shadow-sm hover:bg-blue-100 disabled:opacity-40 transition-colors"
              >
                <span className="text-lg">🔵</span>
                <span className="text-xs font-bold">Recycling</span>
                <span className="text-[10px] text-blue-700">Pin 10 (&apos;R&apos;)</span>
              </button>

              <button
                type="button"
                onClick={() => triggerLid("trash", "Trash")}
                disabled={!connected}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-3 text-slate-900 shadow-sm hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <span className="text-lg">⚫</span>
                <span className="text-xs font-bold">Trash</span>
                <span className="text-[10px] text-slate-700">Pin 11 (&apos;T&apos;)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={closeAll}
              disabled={!connected}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Close All Lids (&apos;X&apos;)
            </button>
          </div>

          {/* Activity Console */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Serial Activity Log</p>
            <div className="h-28 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-300 space-y-1">
              {logs.map((line, idx) => (
                <p key={idx} className={idx === 0 ? "text-emerald-400 font-semibold" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Wiring Guide Notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1 text-xs text-amber-900">
            <p className="font-semibold flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-600" /> Microcontroller Setup
            </p>
            <p className="text-[11px] leading-relaxed">
              Upload <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">firmware/arduino_bins.ino</code> to your Arduino or ESP32. Wire SG90 or MG996R servo signals to Pins 9, 10, and 11 with 5V external power.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">Web Serial Protocol: 9600 Baud</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
