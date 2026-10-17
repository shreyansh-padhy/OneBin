import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneBin - AI Waste Classification",
  description: "Instant multimodal waste sorting into Compost, Recycling, and Trash powered by Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
