"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession } from "./supabase/session";
import { createAdminClient, staffLoginEmail } from "./supabase/admin";
import { loginError, normalizeLogin, passwordError } from "./staff-login";
import type { EditorResult } from "./site-actions";

type Session = NonNullable<Awaited<ReturnType<typeof getStaffSession>>>;
type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

const noAccess: EditorResult = {
  ok: false,
  message:
    "Seu acesso expirou ou você não tem permissão para gerenciar acessos. Entre novamente.",
};
const failure: EditorResult = {
  ok: false,
  message: "Não foi possível concluir. Tente novamente.",
};
const BANNED_FOR = "876000h";

/**
 * Owner session for table writes (RLS) and the admin client for Auth only.
 * The secret key is never used before the owner check passes.
 */
async function requireOwnerWithAdmin(
  stylistId: unknown,
): Promise<{ session: Session; admin: Admin } | EditorResult> {
  if (typeof stylistId !== "string" || !stylistId) return failure;
  const session = await getStaffSession();
  if (session?.profile.role !== "owner") return noAccess;
  const admin = createAdminClient();
  if (!admin)
    return {
      ok: false,
      message:
        "Configure SUPABASE_SECRET_KEY no servidor para gerenciar os acessos da equipe.",
    };
  return { session, admin };
}

/** The team login linked to a professional; owner accounts are managed elsewhere. */
async function staffAccount(session: Session, stylistId: string) {
  const { data, error } = await session.supabase
    .from("staff_profiles")
    .select("user_id,role,login,active")
    .eq("stylist_id", stylistId)
    .maybeSingle();
  return { account: data, error };
}

async function loginTaken(session: Session, login: string) {
  const { data, error } = await session.supabase
    .from("staff_profiles")
    .select("user_id")
    .eq("login", login)
    .maybeSingle();
  return error ? null : Boolean(data);
}

function authMessage(error: { code?: string; status?: number }) {
  if (error.code === "email_exists" || error.code === "user_already_exists" || error.status === 422)
    return "Este usuário já está em uso. Escolha outro.";
  if (error.code === "email_address_invalid")
    return "O Supabase recusou o domínio interno dos logins. Configure STAFF_LOGIN_DOMAIN com um domínio do salão.";
  if (error.code === "weak_password")
    return "A senha é fraca demais para o Supabase. Use uma senha mais longa.";
  return failure.message;
}

function refreshPanel() {
  revalidatePath("/painel");
}

export async function createStaffAccess(input: {
  stylistId: string;
  login: string;
  password: string;
}): Promise<EditorResult> {
  const context = await requireOwnerWithAdmin(input?.stylistId);
  if ("ok" in context) return context;
  const { session, admin } = context;
  const login = normalizeLogin(String(input.login ?? ""));
  const password = String(input.password ?? "");
  const invalid = loginError(login) ?? passwordError(password);
  if (invalid) return { ok: false, message: invalid };
  const [stylist, existing, taken] = await Promise.all([
    session.supabase
      .from("stylists")
      .select("id,deleted_at")
      .eq("id", input.stylistId)
      .maybeSingle(),
    staffAccount(session, input.stylistId),
    loginTaken(session, login),
  ]);
  if (stylist.error || existing.error || taken === null) return failure;
  if (!stylist.data || stylist.data.deleted_at)
    return { ok: false, message: "Este profissional não está mais cadastrado." };
  if (existing.account)
    return { ok: false, message: "Este profissional já tem acesso ao painel." };
  if (taken) return { ok: false, message: "Este usuário já está em uso. Escolha outro." };

  const created = await admin.auth.admin.createUser({
    email: staffLoginEmail(login),
    password,
    email_confirm: true,
    app_metadata: { kind: "equipe" },
  });
  if (created.error || !created.data.user)
    return { ok: false, message: created.error ? authMessage(created.error) : failure.message };
  const { error } = await session.supabase.from("staff_profiles").insert({
    user_id: created.data.user.id,
    role: "staff",
    stylist_id: input.stylistId,
    login,
    active: true,
  });
  if (error) {
    const undo = await admin.auth.admin.deleteUser(created.data.user.id);
    return {
      ok: false,
      message: undo.error
        ? `Não foi possível vincular o acesso, e o login "${login}" ficou sem uso no Supabase. Remova-o em Authentication → Users e tente de novo.`
        : failure.message,
    };
  }
  refreshPanel();
  return { ok: true, message: `Acesso criado. Usuário: ${login}.` };
}

export async function changeStaffLogin(input: {
  stylistId: string;
  login: string;
}): Promise<EditorResult> {
  const context = await requireOwnerWithAdmin(input?.stylistId);
  if ("ok" in context) return context;
  const { session, admin } = context;
  const login = normalizeLogin(String(input.login ?? ""));
  const invalid = loginError(login);
  if (invalid) return { ok: false, message: invalid };
  const { account, error: readError } = await staffAccount(session, input.stylistId);
  if (readError) return failure;
  if (account?.role !== "staff" || !account.login)
    return { ok: false, message: "Este profissional não tem um acesso da equipe." };
  if (account.login === login) return { ok: true, message: "O usuário continua o mesmo." };
  const taken = await loginTaken(session, login);
  if (taken === null) return failure;
  if (taken) return { ok: false, message: "Este usuário já está em uso. Escolha outro." };

  const renamed = await admin.auth.admin.updateUserById(account.user_id, {
    email: staffLoginEmail(login),
    email_confirm: true,
  });
  if (renamed.error) return { ok: false, message: authMessage(renamed.error) };
  const { error } = await session.supabase
    .from("staff_profiles")
    .update({ login })
    .eq("user_id", account.user_id);
  if (error) {
    const undo = await admin.auth.admin.updateUserById(account.user_id, {
      email: staffLoginEmail(account.login),
      email_confirm: true,
    });
    return {
      ok: false,
      message: undo.error
        ? `O login mudou no Supabase para "${login}", mas o painel ainda mostra "${account.login}". Tente trocar novamente.`
        : failure.message,
    };
  }
  refreshPanel();
  return { ok: true, message: `Usuário alterado para ${login}.` };
}

export async function resetStaffPassword(input: {
  stylistId: string;
  password: string;
}): Promise<EditorResult> {
  const context = await requireOwnerWithAdmin(input?.stylistId);
  if ("ok" in context) return context;
  const { session, admin } = context;
  const password = String(input.password ?? "");
  const invalid = passwordError(password);
  if (invalid) return { ok: false, message: invalid };
  const { account, error: readError } = await staffAccount(session, input.stylistId);
  if (readError) return failure;
  if (account?.role !== "staff")
    return { ok: false, message: "Este profissional não tem um acesso da equipe." };
  const { error } = await admin.auth.admin.updateUserById(account.user_id, { password });
  if (error) return { ok: false, message: authMessage(error) };
  return { ok: true, message: "Senha redefinida. Informe a nova senha ao profissional." };
}

/**
 * Deactivating cuts database access at once (profile) and blocks new sign-ins
 * (Auth ban). Reactivating lifts the ban before restoring the profile.
 */
export async function setStaffActive(input: {
  stylistId: string;
  active: boolean;
}): Promise<EditorResult> {
  const context = await requireOwnerWithAdmin(input?.stylistId);
  if ("ok" in context) return context;
  const { session, admin } = context;
  if (typeof input.active !== "boolean") return failure;
  const { account, error: readError } = await staffAccount(session, input.stylistId);
  if (readError) return failure;
  if (account?.role !== "staff")
    return { ok: false, message: "Este profissional não tem um acesso da equipe." };
  if (account.active === input.active)
    return { ok: true, message: input.active ? "O acesso já está ativo." : "O acesso já está desativado." };

  const setProfile = (active: boolean) =>
    session.supabase.from("staff_profiles").update({ active }).eq("user_id", account.user_id);
  const setBan = (banned: boolean) =>
    admin.auth.admin.updateUserById(account.user_id, {
      ban_duration: banned ? BANNED_FOR : "none",
    });

  if (!input.active) {
    const profile = await setProfile(false);
    if (profile.error) return failure;
    const ban = await setBan(true);
    refreshPanel();
    return {
      ok: true,
      message: ban.error
        ? "Acesso desativado no painel. O bloqueio do login no Supabase falhou; a conta continua sem acesso aos dados."
        : "Acesso desativado.",
    };
  }
  const unban = await setBan(false);
  if (unban.error) return { ok: false, message: authMessage(unban.error) };
  const profile = await setProfile(true);
  if (profile.error) {
    const undo = await setBan(true);
    return {
      ok: false,
      message: undo.error
        ? "Não foi possível reativar o acesso, e o login ficou desbloqueado no Supabase sem acesso aos dados. Tente novamente."
        : failure.message,
    };
  }
  refreshPanel();
  return { ok: true, message: "Acesso reativado." };
}
