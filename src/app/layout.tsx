import "./globals.css";
import type { Metadata } from "next";
import Providers from "./(providers)/providers";
import Navbar from "@/components/Navbar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Slanderify", description: "Football slander names" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
