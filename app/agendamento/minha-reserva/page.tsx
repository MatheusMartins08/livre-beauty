import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ActionContent } from "@/components/ui";
import { ReservationLookup } from "@/components/reservation-lookup";
import { pageMetadata } from "@/lib/metadata";
import { normalizeReservationCode } from "@/lib/reservation";

export const metadata: Metadata = {
  ...pageMetadata(
    "Minha reserva",
    "Consulte ou cancele seu agendamento no Livre Beauty com o código da reserva e o seu celular.",
    "/agendamento/minha-reserva",
  ),
  // Personal lookups have nothing to index.
  robots: { index: false, follow: false },
};

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const code =
    typeof query.codigo === "string" ? (normalizeReservationCode(query.codigo) ?? "") : "";
  return (
    <div className="booking-page">
      <PageIntro
        eyebrow="MINHA RESERVA"
        title="Seu horário, à mão."
        emphasis="à mão."
        description="Informe o código da reserva e o celular usado no agendamento para consultar ou cancelar."
      >
        <Link href="/agendamento" className="action-link mt-6">
          <ActionContent>Fazer um novo agendamento</ActionContent>
        </Link>
      </PageIntro>
      <section className="container section" aria-label="Consultar reserva">
        <ReservationLookup initialCode={code} />
      </section>
    </div>
  );
}
