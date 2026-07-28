import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "StockCompass — AI Trading Coach",
  description:
    "A futuristic command center for learning the market: AI pattern explanations, natural-language stock search, risk scoring, scenario simulation, and a portfolio copilot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
