import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Company Portal",
  description: "Company Finance & Operations Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-100">
        <TopNav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
