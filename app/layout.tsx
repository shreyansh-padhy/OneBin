import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneBin - AI Waste Classification",
  description: "Point your camera at an item and find out if it goes in compost, recycling, or trash. Runs entirely in your browser.",
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
