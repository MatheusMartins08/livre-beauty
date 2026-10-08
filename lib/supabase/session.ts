import "server-only";

import { cache } from "react";
import { createClient } from "./server";

export const getStaffSession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("user_id,role,stylist_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profileError)
    throw new Error("Não foi possível verificar o acesso da equipe.");
  if (!profile) return null;
  return { supabase, profile, email: data.user.email ?? "" };
});
