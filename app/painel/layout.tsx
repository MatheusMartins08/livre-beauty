import type { Metadata } from "next";
import "./painel.css";

export const metadata: Metadata = {
  title: "Painel do ateliê",
  description: "Agenda, clientes, equipe e fechamento do Livre Beauty.",
  robots: { index: false, follow: false },
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="lb-admin">{children}</div>;
}
