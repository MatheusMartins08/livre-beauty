import type { Metadata } from "next";
import Link from "next/link";
import { DemoAccess } from "@/components/admin/demo-access";

export const metadata: Metadata = { title: "Acesso da equipe" };

export default function StaffAccessPage() {
  return (
    <div className="lb-access">
      <div className="lb-access-story">
        <Link href="/" className="lb-brand">
          livre<span>BEAUTY ATELIÊ</span>
        </Link>
        <div>
          <h1>
            Mais tempo para
            <br />
            cuidar de cada detalhe.
          </h1>
          <p>
            A agenda, a equipe e a rotina do ateliê.
            <br />
            Tudo no mesmo lugar.
          </p>
        </div>
        <p>Livre Beauty · Espaço da equipe</p>
      </div>
      <div className="lb-access-form">
        <DemoAccess />
        <Link className="lb-text-button" href="/">
          Voltar para o site
        </Link>
      </div>
    </div>
  );
}
