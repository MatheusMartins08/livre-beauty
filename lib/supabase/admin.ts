import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

/**
 * Auth administration (create logins, reset passwords, block accounts). Uses
 * the secret key, so it only runs on the server after an owner check, and is
 * never used for table reads or writes: those keep the owner's session and RLS.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) return null;
  return createClient<Database>(supabaseConfig().url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// .invalid is reserved (RFC 2606): mail to it can never be delivered, so a
// password recovery request cannot hand the account to someone else.
// Set once, before creating accounts; changing it breaks existing logins.
export function staffLoginEmail(login: string) {
  const domain = process.env.STAFF_LOGIN_DOMAIN || "equipe.livrebeauty.invalid";
  return `${login}@${domain}`;
}
