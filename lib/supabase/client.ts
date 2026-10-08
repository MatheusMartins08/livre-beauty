"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

export function createClient() {
  const { url, publishableKey } = supabaseConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
