import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { passwordGateEnabled } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "MonthStayz Invoicing",
  description: "Invoices, receipts and payment tracking synced with Airtable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="no-print bg-brand text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <img src="/logo.avif" alt="" className="h-7 w-7 rounded bg-white/10 object-contain p-0.5" />
              MonthStayz Invoicing
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-teal-100">synced with Airtable</span>
              {passwordGateEnabled() && <LogoutButton />}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
