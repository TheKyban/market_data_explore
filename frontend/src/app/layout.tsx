import type { Metadata } from "next";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Data Explorer — Derivatives Analytics",
  description:
    "Upload and explore derivative market data (Feather files). Filter by instrument type, expiry, strike, and symbol. View option and futures contract analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
