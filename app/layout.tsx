import type { Metadata } from "next";
import "./globals.css";
import VerticalDock from "@/components/VerticalDock";

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
    <html lang="en" data-theme="light">
      <body className="antialiased bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {children}
        <VerticalDock />
      </body>
    </html>
  );
}
