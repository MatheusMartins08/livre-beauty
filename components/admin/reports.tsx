"use client";

import { useState } from "react";
import { ArrowUpRight, DownloadSimple } from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import {
  charge,
  currency,
  demoCommissionRate,
  downloadCsv,
  formatDate,
  getPeriodRange,
  payout,
  type AdminAppointment,
  type AdminRole,
  type Period,
} from "@/lib/admin";
import { Panel, Person } from "./ui";
import { MobilePagination, useMobilePagination } from "./mobile-pagination";

export function Production({
  appointments,
  stylistId,
  role,
  compact = false,
  onSeeAll,
}: {
  appointments: AdminAppointment[];
  stylistId: string;
  role: AdminRole;
  compact?: boolean;
  onSeeAll?: () => void;
}) {
  const { stylists } = useCatalog();
  const people =
    role === "dono"
      ? stylists
      : stylists.filter((item) => item.id === stylistId);
  return (
    <Panel
      title={role === "dono" ? "Produção da equipe" : "Minha produção"}
      description="Atendimentos e comissões da data selecionada."
      action={
        compact &&
        onSeeAll && (
          <button className="lb-text-button" onClick={onSeeAll}>
            Ver equipe
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        )
      }
    >
      <div className="lb-production">
        {people.map((person) => {
          const own = appointments.filter(
            (item) =>
              item.performedBy === person.id && item.status !== "cancelado",
          );
          const completed = own.filter((item) => item.status === "concluido");
          return (
            <div className="lb-production-person" key={person.id}>
              <Person stylistId={person.id} />
              <dl>
                <div>
                  <dt>Atendidos</dt>
                  <dd>
                    {completed.length}
                    <span> / {own.length}</span>
                  </dd>
                </div>
                <div>
                  <dt>Comissão</dt>
                  <dd>
                    {currency(
                      completed.reduce((sum, item) => sum + payout(item), 0),
                    )}
                  </dd>
                </div>
              </dl>
              {!compact && (
                <div className="lb-specialties">
                  <span>{person.specialties.join(" · ")}</span>
                  <p>
                    {own.filter((item) => item.status === "agendado").length}{" "}
                    próximos atendimentos
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function Payroll({
  appointments,
  date,
  role,
  stylistId,
}: {
  appointments: AdminAppointment[];
  date: string;
  role: AdminRole;
  stylistId: string;
}) {
  const { services, stylists } = useCatalog();
  const [period, setPeriod] = useState<Period>("mes");
  const range = getPeriodRange(date, period);
  const completed = appointments.filter(
    (item) =>
      item.date >= range.start &&
      item.date <= range.end &&
      item.status === "concluido",
  );
  const people =
    role === "dono"
      ? stylists
      : stylists.filter((item) => item.id === stylistId);
  const summaries = people.map((person) => {
    const own = completed.filter((item) => item.performedBy === person.id);
    return {
      person,
      count: own.length,
      revenue: own.reduce((sum, item) => sum + charge(item), 0),
      total: own.reduce((sum, item) => sum + payout(item), 0),
    };
  });
  const totals = summaries.reduce(
    (sum, row) => ({
      count: sum.count + row.count,
      revenue: sum.revenue + row.revenue,
      total: sum.total + row.total,
    }),
    { count: 0, revenue: 0, total: 0 },
  );
  function exportReport() {
    downloadCsv(`livre-fechamento-${range.start}-${range.end}.csv`, [
      [
        "Profissional",
        "Atendidos",
        "Receita dos serviços",
        "Comissão (%)",
        "Total a repassar",
      ],
      ...summaries.map((row) => [
        row.person.name,
        row.count,
        row.revenue.toFixed(2),
        demoCommissionRate * 100,
        row.total.toFixed(2),
      ]),
      [
        "Total",
        totals.count,
        totals.revenue.toFixed(2),
        demoCommissionRate * 100,
        totals.total.toFixed(2),
      ],
    ]);
  }
  const actions = (
    <div className="lb-report-actions">
      <div className="lb-segmented" aria-label="Período do fechamento">
        {(["dia", "semana", "mes"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
          >
            {{ dia: "Dia", semana: "Semana", mes: "Mês" }[value]}
          </button>
        ))}
      </div>
      <button className="lb-button" onClick={exportReport}>
        <DownloadSimple size={18} aria-hidden="true" />
        Exportar CSV
      </button>
    </div>
  );
  return (
    <>
      <Panel
        title={role === "dono" ? "Fechamento da equipe" : "Minhas comissões"}
        description={`${formatDate(range.start)} a ${formatDate(range.end)} · somente atendimentos concluídos.`}
        action={actions}
      >
        <div className="lb-table-wrap">
          <table className="lb-table">
            <caption className="lb-sr-only">
              Comissões por profissional no período
            </caption>
            <thead>
              <tr>
                <th scope="col">Profissional</th>
                <th scope="col">Atendidos</th>
                <th scope="col">Receita dos serviços</th>
                <th scope="col">Comissão</th>
                <th scope="col">Total a repassar</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((row) => (
                <tr key={row.person.id}>
                  <th scope="row">
                    <Person stylistId={row.person.id} compact />
                  </th>
                  <td data-label="Atendidos">{row.count}</td>
                  <td data-label="Receita dos serviços">
                    {currency(row.revenue)}
                  </td>
                  <td data-label="Comissão">{demoCommissionRate * 100}%</td>
                  <td data-label="Total a repassar">
                    <strong className="lb-total">{currency(row.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">
                  {role === "dono" ? "Total da equipe" : "Meu total"}
                </th>
                <td data-label="Atendidos">{totals.count}</td>
                <td data-label="Receita dos serviços">
                  {currency(totals.revenue)}
                </td>
                <td data-label="Comissão">{demoCommissionRate * 100}%</td>
                <td data-label="Total a repassar">
                  <strong>{currency(totals.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="lb-footnote">
          Regra de exemplo: {demoCommissionRate * 100}% do valor combinado para
          cada serviço concluído. O percentual real será definido pelo
          estabelecimento. Não inclui salário fixo, descontos ou pagamentos
          efetivos.
        </p>
      </Panel>
      <Panel
        title="Serviços realizados no período"
        description="Distribuição dos atendimentos concluídos."
      >
        <div className="lb-service-report">
          {services.map((service) => {
            const count = completed.filter(
              (item) => item.serviceId === service.id,
            ).length;
            return (
              <div key={service.id}>
                <span>{service.name}</span>
                <strong>
                  {count}
                  <small> atendimento{count !== 1 ? "s" : ""}</small>
                </strong>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

export function ServiceCatalog() {
  const { services, stylists } = useCatalog();
  const pagination = useMobilePagination(services.map((item) => item.id));
  return (
    <Panel
      title="Serviços do ateliê"
      description="O mesmo catálogo disponível no site e no agendamento."
    >
      <div className="lb-table-wrap">
        <table className="lb-table lb-catalog-table">
          <caption className="lb-sr-only">
            Preços de referência, duração e profissionais
          </caption>
          <thead>
            <tr>
              <th scope="col">Serviço</th>
              <th scope="col">Categoria</th>
              <th scope="col">Duração</th>
              <th scope="col">A partir de</th>
              <th scope="col">Profissionais</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={service.id} className={pagination.rowClass(index)}>
                <th scope="row">{service.name}</th>
                <td data-label="Categoria">{service.category}</td>
                <td data-label="Duração">{service.duration} min</td>
                <td data-label="A partir de">{currency(service.price)}</td>
                <td data-label="Profissionais">
                  {stylists
                    .filter((person) => person.serviceIds.includes(service.id))
                    .map((person) => person.name.split(" ")[0])
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobilePagination {...pagination} label="Páginas de serviços" />
      <p className="lb-footnote">
        O valor final é combinado antes do atendimento e pode ser ajustado na
        agenda.
      </p>
    </Panel>
  );
}
