import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoRequest — API workspace",
  description: "Send HTTP requests and inspect responses with GoRequest.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen antialiased">{children}</body></html>;
}
