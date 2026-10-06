"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { stylists } from "@/content/salon";
import type { AdminRole } from "@/lib/admin";

export function DemoAccess() {
  const [role, setRole] = useState<AdminRole>("dono");
  const [stylist, setStylist] = useState("lia");
  return (
    <div className="lb-access-card">
      <h2>Seu espaço no ateliê</h2>
      <p>Escolha um perfil para explorar o painel.</p>
      <fieldset className="lb-role-choices">
        <legend>Perfil de acesso</legend>
        <label>
          <input
            type="radio"
            name="profile"
            value="dono"
            checked={role === "dono"}
            onChange={() => setRole("dono")}
          />
          <span>
            <strong>Dono do estabelecimento</strong>
            <small>Agenda completa, equipe e gestão financeira.</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name="profile"
            value="funcionario"
            checked={role === "funcionario"}
            onChange={() => setRole("funcionario")}
          />
          <span>
            <strong>Funcionário</strong>
            <small>Seus atendimentos, clientes e comissões.</small>
          </span>
        </label>
      </fieldset>
      {role === "funcionario" && (
        <label className="lb-field" htmlFor="demo-professional">
          Profissional
          <select
            id="demo-professional"
            value={stylist}
            onChange={(event) => setStylist(event.target.value)}
          >
            {stylists.map((person) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <Link
        className="lb-button lb-button-primary lb-access-submit"
        href={`/painel?perfil=${role}&profissional=${stylist}`}
      >
        Explorar painel
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
      <div className="lb-demo-note">
        <ArrowUpRight size={18} aria-hidden="true" />
        <p>
          <strong>Prévia do painel</strong>Dados fictícios e acesso
          demonstrativo. O login real será conectado na próxima etapa.
        </p>
      </div>
    </div>
  );
}
