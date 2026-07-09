const thb = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function money(n: number): string {
  return thb.format(n || 0);
}

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function company() {
  return {
    name: process.env.COMPANY_NAME ?? "MonthStayz Thailand",
    tagline: process.env.COMPANY_TAGLINE ?? "Experience Luxury Living in Thailand",
    address: process.env.COMPANY_ADDRESS ?? "",
    email: process.env.COMPANY_EMAIL ?? "",
    phone: process.env.COMPANY_PHONE ?? "",
    logoUrl: process.env.COMPANY_LOGO_URL ?? "/logo.avif",
  };
}
