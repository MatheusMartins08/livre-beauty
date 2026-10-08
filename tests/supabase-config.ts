import { readFileSync } from "node:fs";

/** Tests use the same local, ignored configuration as Next.js. */
export function testSupabaseConfig() {
  let local: Record<string, string> = {};
  try {
    local = Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const at = line.indexOf("=");
          return [
            line.slice(0, at),
            line
              .slice(at + 1)
              .trim()
              .replace(/^["']|["']$/g, ""),
          ];
        }),
    );
  } catch {
    /* CI supplies environment variables directly. */
  }
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Configure the Supabase URL and publishable key for integration tests.",
    );
  return { url, headers: { apikey: key, "Content-Type": "application/json" } };
}
