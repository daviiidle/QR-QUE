import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR QUE",
  description: "Order your bubble tea — scan, pick, pay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
