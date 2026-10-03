import { PageMotion } from "@/components/page-motion";
import Link from "next/link";
import { salonPolicies } from "@/content/salon";
import { pageMetadata } from "@/lib/metadata";
import { ActionContent, ButtonLink, PageIntro } from "@/components/ui";

export const metadata = pageMetadata(
  "Políticas do salão",
  "Consulte as políticas do Livre Beauty para agendamento, cancelamento, atrasos, pagamentos e ajustes.",
  "/politicas",
);

export default function PoliciesPage() {
  return (
    <PageMotion animate={false}>
      <PageIntro
        eyebrow="POLÍTICAS DO SALÃO"
        title="Cuidado também é clareza."
        emphasis="clareza."
        description="Combinados que respeitam seu tempo e preservam uma boa experiência para todos."
      />
      <div className="container grid items-start gap-10 pb-16 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20 lg:pb-24">
        <aside className="max-w-[35ch] lg:sticky lg:top-28">
          <p className="text-sm text-[var(--text-body)] leading-relaxed">
            Se precisar de uma resposta rápida, consulte as{" "}
            <Link href="/#faq-title" className="action-link action-inline">
              <ActionContent>dúvidas frequentes</ActionContent>
            </Link>
            .
          </p>
        </aside>
        <div>
          {salonPolicies.map((policy, index) => (
            <section
              key={policy.title}
              className="border-t border-[var(--line)] py-7 first:pt-0 first:border-t-0"
            >
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl">
                <span className="fine-print mr-4 align-middle">
                  0{index + 1}
                </span>
                {policy.title}
              </h2>
              <p className="max-w-[65ch] text-[var(--text-body)] leading-relaxed">
                {policy.text}
              </p>
            </section>
          ))}
          <div className="border-t border-[var(--line)] pt-8">
            <ButtonLink href="/#visite-title" secondary>
              Conhecer os canais de contato
            </ButtonLink>
          </div>
        </div>
      </div>
    </PageMotion>
  );
}
