"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

export async function signIn(
  _previous: { message: string; email: string },
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !password ||
    password.length > 256
  ) {
    return { email, message: "Informe seu e-mail e senha para entrar." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user)
    return {
      email,
      message:
        "Não foi possível entrar. Confira seu e-mail e senha ou tente novamente mais tarde.",
    };
  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      email,
      message:
        "Esta conta não tem acesso à equipe. Solicite o vínculo ao responsável pelo ateliê.",
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
