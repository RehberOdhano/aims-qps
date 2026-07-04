import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIMS QPS Rounding",
  description: "Quality & Patient Safety rounding — Aria Institute of Medical Sciences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
