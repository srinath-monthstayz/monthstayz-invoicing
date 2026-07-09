export const SESSION_COOKIE = "mstz_session";

/**
 * Cookie value that proves the shared password was entered, without storing
 * it in plain text. Uses Web Crypto (not Node's `crypto` module) so this
 * also works in the Edge middleware runtime.
 */
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(process.env.APP_PASSWORD ?? "");
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function passwordGateEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}
