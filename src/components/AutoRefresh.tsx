"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the server every N seconds so edits made directly in Airtable
 * show up on an open dashboard page without a manual reload.
 */
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
