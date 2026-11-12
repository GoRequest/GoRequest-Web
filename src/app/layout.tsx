import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoRequest — API workspace",
  description: "Send HTTP requests and inspect responses with GoRequest.",
  other: { "page-type": "software", "site-kind": "software" },
};

export const viewport: Viewport = { themeColor: "#0f0f0f" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="dark"
      data-type="software"
      data-radius="sharp"
      data-buttons="solid"
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
