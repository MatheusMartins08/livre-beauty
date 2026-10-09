"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeStaffLogin,
  createStaffAccess,
  resetStaffPassword,
  setStaffActive,
} from "@/lib/staff-access-actions";
import type { EditorResult } from "@/lib/site-actions";
import {
  loginError,
  normalizeLogin,
  passwordError,
  PASSWORD_MAX,
  suggestLogin,
} from "@/lib/staff-login";
import { EditorFeedback } from "./fields";
import { useEditorAction } from "./use-editor-action";

/** The panel account linked to a professional, as the owner sees it. */
export interface StaffAccount {
  role: "owner" | "staff";
  login: string | null;
  active: boolean;
}

/**
 * Each action saves at once, outside the professional's form: an Auth account
 * cannot wait for the rest of the profile to be saved.
 */
export function StaffAccessPanel({
  stylistId,
  name,
  account,
}: {
  stylistId: string;
  name: string;
  account: StaffAccount | undefined;
}) {
  const router = useRouter();
  const { result, setResult, pending, run } = useEditorAction();
  const [login, setLogin] = useState(account?.login ?? suggestLogin(name));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"idle" | "login" | "password">("idle");
  const loginId = useId();
  const passwordId = useId();

  function act(action: () => Promise<EditorResult>, validation?: string | null) {
    if (pending) return;
    if (validation) {
      setResult({ ok: false, message: validation });
      return;
    }
    void run(action, (saved) => {
      setResult(saved);
      setPassword("");
      setMode("idle");
      router.refresh();
    });
  }

  const loginField = (
    <label className="lb-field" htmlFor={loginId}>
      Usuário
      <input
        id={loginId}
        value={login}
        maxLength={32}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => setLogin(event.target.value)}
        onBlur={() => setLogin(normalizeLogin(login))}
      />
      <small className="lb-help">
        Letras minúsculas, números, ponto, hífen ou sublinhado.
      </small>
    </label>
  );
  const passwordField = (
    <label className="lb-field" htmlFor={passwordId}>
      {account ? "Nova senha" : "Senha inicial"}
      <input
        id={passwordId}
        type={showPassword ? "text" : "password"}
        value={password}
        maxLength={PASSWORD_MAX}
        autoComplete="new-password"
        onChange={(event) => setPassword(event.target.value)}
      />
      <small className="lb-help">
        De 8 a 72 caracteres. Entregue a senha pessoalmente ao profissional.
      </small>
    </label>
  );
  const showToggle = (
    <label className="lb-check">
      <input
        type="checkbox"
        checked={showPassword}
        onChange={(event) => setShowPassword(event.target.checked)}
      />
      <span>Mostrar senha</span>
    </label>
  );

  return (
    <section className="lb-fieldset lb-access-panel" aria-label="Acesso ao painel">
      <h3 className="lb-subheading">Acesso ao painel</h3>
      {account?.role === "owner" ? (
        <p className="lb-help">
          Este profissional usa a conta do dono, com acesso a todo o painel.
        </p>
      ) : !account ? (
        <>
          <p className="lb-help">
            Com um acesso, {name.split(" ")[0]} entra em /painel/entrar e vê só a
            própria agenda, os próprios clientes, as comissões e o próprio horário.
          </p>
          <div className="lb-form-grid lb-form-grid-2">
            {loginField}
            {passwordField}
          </div>
          {showToggle}
          <div className="lb-form-actions">
            <button
              type="button"
              className="lb-button lb-button-primary"
              disabled={pending}
              onClick={() =>
                act(
                  () => createStaffAccess({ stylistId, login, password }),
                  loginError(login) ?? passwordError(password),
                )
              }
            >
              {pending ? "Criando…" : "Criar acesso"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="lb-access-status">
            Usuário <strong>{account.login}</strong> ·{" "}
            <span className={`lb-badge ${account.active ? "lb-badge-positive" : "lb-badge-neutral"}`}>
              {account.active ? "Ativo" : "Desativado"}
            </span>
          </p>
          {mode === "login" && (
            <div className="lb-form-grid lb-form-grid-2">{loginField}</div>
          )}
          {mode === "password" && (
            <>
              <div className="lb-form-grid lb-form-grid-2">{passwordField}</div>
              {showToggle}
            </>
          )}
          <div className="lb-form-actions">
            {mode === "idle" ? (
              <>
                <button
                  type="button"
                  className="lb-text-button"
                  disabled={pending}
                  onClick={() => {
                    setLogin(account.login ?? "");
                    setMode("login");
                    setResult(null);
                  }}
                >
                  Alterar usuário
                </button>
                <button
                  type="button"
                  className="lb-text-button"
                  disabled={pending}
                  onClick={() => {
                    setMode("password");
                    setResult(null);
                  }}
                >
                  Redefinir senha
                </button>
                <button
                  type="button"
                  className="lb-button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      account.active &&
                      !window.confirm(
                        `Desativar o acesso de ${name}? O login deixa de funcionar e os dados ficam preservados.`,
                      )
                    )
                      return;
                    act(() => setStaffActive({ stylistId, active: !account.active }));
                  }}
                >
                  {account.active ? "Desativar acesso" : "Reativar acesso"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lb-button"
                  disabled={pending}
                  onClick={() => {
                    setMode("idle");
                    setPassword("");
                    setResult(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="lb-button lb-button-primary"
                  disabled={pending}
                  onClick={() =>
                    mode === "login"
                      ? act(() => changeStaffLogin({ stylistId, login }), loginError(login))
                      : act(
                          () => resetStaffPassword({ stylistId, password }),
                          passwordError(password),
                        )
                  }
                >
                  {pending
                    ? "Salvando…"
                    : mode === "login"
                      ? "Salvar usuário"
                      : "Salvar nova senha"}
                </button>
              </>
            )}
          </div>
        </>
      )}
      <EditorFeedback result={result} />
    </section>
  );
}
