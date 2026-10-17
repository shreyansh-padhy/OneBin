// Web Serial API integration for physical IoT smart bin actuation (Arduino / ESP32).
// Communicates over USB-Serial or Bluetooth-Serial at 9600 baud.
// Protocol:
//   'C\n' -> Open Compost Lid (🟢 Green)
//   'R\n' -> Open Recycling Lid (🔵 Blue)
//   'T\n' -> Open Trash Lid (⚫ Black)

interface WebSerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}

interface NavigatorWithSerial extends Navigator {
  serial?: {
    requestPort(): Promise<WebSerialPort>;
  };
}

let activePort: WebSerialPort | null = null;
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

export function isSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export async function connectSerial(baudRate = 9600): Promise<boolean> {
  if (!isSerialSupported()) {
    throw new Error("Web Serial API is not supported in this browser. Use Chrome or Edge.");
  }

  try {
    const nav = navigator as NavigatorWithSerial;
    if (!nav.serial) {
      throw new Error("Serial API unavailable.");
    }
    const port = await nav.serial.requestPort();
    await port.open({ baudRate });
    activePort = port;
    if (port.writable) {
      writer = port.writable.getWriter();
    }
    return true;
  } catch (err) {
    console.error("[OneBin IoT Serial] Connection error:", err);
    throw err;
  }
}

export function isSerialConnected(): boolean {
  return activePort !== null && writer !== null;
}

export async function sendBinCommand(bin: string): Promise<boolean> {
  if (!writer) return false;

  let cmd = "T\n";
  if (bin === "compost") cmd = "C\n";
  else if (bin === "recycling") cmd = "R\n";
  else if (bin === "trash") cmd = "T\n";
  else if (bin === "close_all") cmd = "X\n";

  try {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(cmd));
    return true;
  } catch (err) {
    console.error("[OneBin IoT Serial] Failed to send actuation command:", err);
    return false;
  }
}

export async function disconnectSerial(): Promise<void> {
  try {
    if (writer) {
      await writer.close();
      writer = null;
    }
    if (activePort) {
      await activePort.close();
      activePort = null;
    }
  } catch (err) {
    console.error("[OneBin IoT Serial] Error closing port:", err);
  }
}
