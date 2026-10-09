"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { staffLoginEmail } from "./supabase/admin";
import { LOGIN_PATTERN, normalizeLogin } from "./staff-login";

/** The owner signs in with an e-mail; the team, with the username created in the panel. */
function signInEmail(identifier: string) {
  if (identifier.includes("@"))
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) && identifier.length <= 254
      ? identifier.toLowerCase()
      : null;
  const login = normalizeLogin(identifier);
  return LOGIN_PATTERN.test(login) ? staffLoginEmail(login) : null;
}

export async function signIn(
  _previous: { message: string; login: string },
  formData: FormData,
) {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = signInEmail(login);
  if (!email || !password || password.length > 256) {
    return { login, message: "Informe seu usuário ou e-mail e sua senha para entrar." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user)
    return {
      login,
      message:
        error?.code === "user_banned"
          ? "Este acesso está desativado. Fale com o responsável pelo ateliê."
          : error?.code === "over_request_rate_limit" || error?.status === 429
            ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente."
            : "Não foi possível entrar. Confira seu usuário ou e-mail e sua senha.",
    };
  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("user_id,active")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    return {
      login,
      message: profile
        ? "Este acesso está desativado. Fale com o responsável pelo ateliê."
        : "Esta conta não tem acesso à equipe. Solicite o vínculo ao responsável pelo ateliê.",
    };
  }
  revalidatePath("/painel", "layout");
  redirect("/painel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/painel", "layout");
  redirect("/painel/entrar");
}
