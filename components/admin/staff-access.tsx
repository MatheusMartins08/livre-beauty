"use client";

import { useActionState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { signIn } from "@/lib/auth-actions";

export function StaffAccess() {
  const [state, action, pending] = useActionState(signIn, {
    message: "",
    email: "",
  });
  return (
    <div className="lb-access-card">
      <h2>Seu espaço no ateliê</h2>
      <p>Entre com o e-mail e a senha da sua conta da equipe.</p>
      <form action={action} className="lb-form" aria-busy={pending}>
        <label className="lb-field">
          E-mail
          <input
            name="email"
            type="email"
            defaultValue={state.email}
            autoComplete="username"
            required
            maxLength={254}
            aria-describedby={state.message ? "login-error" : undefined}
          />
        </label>
        <label className="lb-field">
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            aria-describedby={state.message ? "login-error" : undefined}
          />
        </label>
        {state.message && (
          <p id="login-error" className="lb-form-error" role="alert">
            {state.message}
          </p>
        )}
        <button
          className="lb-button lb-button-primary lb-access-submit"
          type="submit"
          disabled={pending}
        >
          {pending ? "Entrando…" : "Entrar no painel"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>
      <p className="lb-help">
        O acesso é exclusivo para contas cadastradas pelo responsável pelo
        ateliê.
      </p>
    </div>
  );
}
