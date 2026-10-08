"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import {
  ArrowUpRight,
  Browser,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChartBar,
  CheckCircle,
  List,
  Plus,
  Scissors,
  SignOut,
  SquaresFour,
  Users,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { useCatalog } from "@/components/catalog-provider";
import {
  changeAppointmentStatus,
  saveAppointment as persistAppointment,
  saveClient as persistClient,
} from "@/lib/admin-actions";
import { signOut } from "@/lib/auth-actions";
import {
  addDays,
  appointmentError,
  charge,
  currency,
  formatDate,
  payout,
  sectionLabels,
  type AdminAppointment,
  type AdminClient,
  type AdminRole,
  type AdminSection,
  type AppointmentStatus,
} from "@/lib/admin";
import { periodsForDate, type ScheduleException } from "@/lib/opening-hours";
import { Agenda } from "./agenda";
import { AppointmentForm } from "./appointment-form";
import { Clients } from "./clients";
import { Payroll, Production, ServiceCatalog } from "./reports";
import { SiteEditor, type SiteEditorData } from "./site/site-editor";

const sections: { id: AdminSection; icon: Icon; ownerOnly?: boolean }[] = [
  { id: "visao", icon: SquaresFour },
  { id: "agenda", icon: CalendarBlank },
  { id: "clientes", icon: Users },
  { id: "equipe", icon: Scissors, ownerOnly: true },
  { id: "fechamento", icon: ChartBar },
  { id: "servicos", icon: List },
  { id: "site", icon: Browser, ownerOnly: true },
];
const descriptions: Record<AdminSection, string> = {
  visao: "Um olhar para o dia. Mais espaço para cuidar.",
  agenda: "Organize os horários e acompanhe cada atendimento.",
  clientes: "Conheça quem confia no cuidado do ateliê.",
  equipe: "Cada profissional, cada atendimento, cada detalhe.",
  fechamento: "Atendimentos concluídos e repasses da equipe.",
  servicos: "O cuidado do Livre, organizado para a equipe.",
  site: "Textos, fotos, serviços, equipe e horários publicados no site.",
};

export function AdminDashboard({
  today,
  initialRole,
  initialStylist,
  initialAppointments,
  initialClients,
  exceptions,
  commissionRate,
  accountEmail,
  siteEditor,
}: {
  today: string;
  initialRole: AdminRole;
  initialStylist: string;
  initialAppointments: AdminAppointment[];
  initialClients: AdminClient[];
  exceptions: ScheduleException[];
  commissionRate: number;
  accountEmail: string;
  siteEditor: SiteEditorData | null;
}) {
  const role = initialRole;
  const router = useRouter();
  const stylistId = initialStylist;
  const catalog = useCatalog();
  const { stylists } = catalog;
  const appointments = initialAppointments;
  const clients = initialClients;
  const mutationLock = useRef(false);
  const [section, setSection] = useState<AdminSection>("visao");
  const [date, setDate] = useState(today);
  const [editing, setEditing] = useState<AdminAppointment | "new" | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const person = stylists.find((item) => item.id === stylistId);
  const scopedAppointments =
    role === "dono"
      ? appointments
      : appointments.filter((item) => item.performedBy === stylistId);
  const scopedClients =
    role === "dono"
      ? clients
      : clients.filter((client) =>
          scopedAppointments.some((item) => item.clientId === client.id),
        );
  const dayAppointments = scopedAppointments.filter(
    (item) => item.date === date,
  );
  const active = dayAppointments.filter((item) => item.status !== "cancelado");
  const completed = active.filter((item) => item.status === "concluido");
  const revenue = completed.reduce((sum, item) => sum + charge(item), 0);
  const commissions = completed.reduce(
    (sum, item) => sum + payout(item, commissionRate),
    0,
  );
  const availableSections = sections.filter(
    (item) =>
      (!item.ownerOnly || role === "dono") && (item.id !== "site" || siteEditor),
  );

  function navigate(next: AdminSection) {
    setSection(next);
    setMenuOpen(false);
    setAnnouncement("");
    setActionError("");
    if (window.matchMedia("(max-width: 999px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function changeStatus(id: string, status: AppointmentStatus) {
    if (mutationLock.current) return;
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment) return;
    const validation = appointmentError(
      { ...appointment, status },
      appointments,
      catalog,
      exceptions,
    );
    if (validation) {
      setActionError(validation);
      return;
    }
    mutationLock.current = true;
    setActionError("");
    setAnnouncement("");
    startTransition(async () => {
      try {
        const result = await changeAppointmentStatus(id, status);
        if (result.ok) setAnnouncement("Status do atendimento atualizado.");
        else setActionError(result.message);
      } catch {
        setActionError("Não foi possível atualizar o status. Tente novamente.");
      } finally {
        mutationLock.current = false;
      }
    });
  }
  async function saveAppointment(
    appointment: AdminAppointment,
  ): Promise<string | null> {
    setAnnouncement("");
    setActionError("");
    const result = await persistAppointment(appointment);
    if (!result.ok) return result.message;
    setDate(result.data.date);
    setEditing(null);
    setAnnouncement("Atendimento salvo.");
    return null;
  }
  async function saveClient(client: AdminClient): Promise<string | null> {
    setAnnouncement("");
    setActionError("");
    const result = await persistClient(client);
    if (!result.ok) return result.message;
    setAnnouncement("Cliente salvo.");
    return null;
  }
  const agendaProps = {
    appointments: dayAppointments,
    clients: scopedClients,
    role,
    onEdit: setEditing,
    onNew: () => setEditing("new"),
    onStatusChange: changeStatus,
  };
  const clientProps = {
    clients: scopedClients,
    appointments: scopedAppointments,
    role,
    onSave: saveClient,
  };

  return (
    <div className="lb-workspace">
      <aside className="lb-sidebar">
        <Link href="/painel" className="lb-brand">
          livre<span>BEAUTY ATELIÊ</span>
        </Link>
        <div className="lb-workspace-name">
          <span className="lb-workspace-dot" />
          Espaço da equipe
        </div>
        <div className="lb-mobile-menu-button">
          <button
            className="lb-button"
            aria-expanded={menuOpen}
            aria-controls="lb-panel-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <List size={18} aria-hidden="true" />
            )}
            Menu
          </button>
        </div>
        <nav
          id="lb-panel-nav"
          className={`lb-nav${menuOpen ? " lb-nav-open" : ""}`}
          aria-label="Navegação do painel"
        >
          {availableSections.map(({ id, icon: SectionIcon }) => (
            <button
              type="button"
              key={id}
              aria-current={section === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <SectionIcon
                size={21}
                weight={section === id ? "fill" : "regular"}
                aria-hidden="true"
              />
              <span>
                {role === "funcionario" && id === "fechamento"
                  ? "Minhas comissões"
                  : sectionLabels[id]}
              </span>
            </button>
          ))}
        </nav>
        <div
          className={`lb-sidebar-bottom${menuOpen ? " lb-sidebar-bottom-open" : ""}`}
        >
          <Link href="/" className="lb-site-link">
            Visitar o site
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <div className="lb-sidebar-user">
            <span className="lb-user-avatar">
              {(person?.name ?? accountEmail)
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{person?.name ?? accountEmail}</strong>
              <small>
                {role === "dono" ? "Gestão do ateliê" : "Funcionário"}
              </small>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="lb-icon-button"
                aria-label="Sair do painel"
              >
                <SignOut size={19} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="lb-workspace-main">
        <header className="lb-topbar">
          <span>
            Painel do ateliê{" "}
            <span className="lb-breadcrumb">/ {sectionLabels[section]}</span>
          </span>
          <span className="lb-profile-switch">
            {role === "dono" ? "Gestão do ateliê" : (person?.name ?? "Equipe")}
          </span>
        </header>
        <div className="lb-content">
          <div className="lb-page-heading">
            <div>
              <h1>
                {section === "visao"
                  ? role === "dono"
                    ? "O dia no ateliê"
                    : `Seu dia, ${(person?.name ?? accountEmail).split(" ")[0]}`
                  : role === "funcionario" && section === "fechamento"
                    ? "Minhas comissões"
                    : sectionLabels[section]}
              </h1>
              <p>{descriptions[section]}</p>
            </div>
            {section === "visao" && (
              <button
                className="lb-button lb-button-primary"
                onClick={() => setEditing("new")}
              >
                <Plus size={18} aria-hidden="true" />
                Novo agendamento
              </button>
            )}
          </div>
          <div className="lb-date-toolbar" hidden={section === "site"}>
            <div>
              <CalendarBlank size={19} aria-hidden="true" />
              <span>{formatDate(date, true)}</span>
              {!periodsForDate(date, catalog.openingPeriods, exceptions)
                .length && (
                <span className="lb-badge lb-badge-neutral">
                  Ateliê fechado
                </span>
              )}
            </div>
            <div className="lb-date-controls">
              <button
                className="lb-icon-button"
                aria-label="Dia anterior"
                onClick={() => setDate(addDays(date, -1))}
              >
                <CaretLeft size={17} aria-hidden="true" />
              </button>
              <label>
                <span className="lb-sr-only">Data do painel</span>
                <input
                  aria-label="Data do painel"
                  type="date"
                  value={date}
                  min="2000-01-01"
                  max="2099-12-31"
                  onChange={(event) => {
                    if (event.target.value && event.target.validity.valid)
                      setDate(event.target.value);
                  }}
                />
              </label>
              <button
                className="lb-icon-button"
                aria-label="Próximo dia"
                onClick={() => setDate(addDays(date, 1))}
              >
                <CaretRight size={17} aria-hidden="true" />
              </button>
              <button
                className="lb-text-button"
                disabled={date === today}
                onClick={() => setDate(today)}
              >
                Hoje
              </button>
            </div>
          </div>
          {announcement && (
            <div className="lb-feedback" role="status">
              <CheckCircle size={18} aria-hidden="true" />
              <span>{announcement}</span>
              <button
                className="lb-icon-button"
                aria-label="Fechar aviso"
                onClick={() => setAnnouncement("")}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          {actionError && (
            <div className="lb-form-error lb-action-error" role="alert">
              <span>{actionError}</span>
              <button
                className="lb-icon-button"
                aria-label="Fechar erro"
                onClick={() => setActionError("")}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          {section === "visao" && (
            <>
              <dl className="lb-metrics" aria-label="Resumo do dia">
                <div>
                  <dt>Horários marcados</dt>
                  <dd>{active.length.toString().padStart(2, "0")}</dd>
                  <small>
                    {active.filter((item) => item.status === "agendado").length}{" "}
                    aguardando atendimento
                  </small>
                </div>
                <div>
                  <dt>Atendimentos concluídos</dt>
                  <dd>
                    {completed.length.toString().padStart(2, "0")}
                    <span> / {active.length}</span>
                  </dd>
                  <small>Produção da data selecionada</small>
                </div>
                <div>
                  <dt>
                    {role === "dono"
                      ? "Receita avulsa do dia"
                      : "Meus serviços avulsos"}
                  </dt>
                  <dd>{currency(revenue)}</dd>
                  <small>Somente atendimentos concluídos</small>
                </div>
                <div>
                  <dt>
                    {role === "dono"
                      ? "Repasse à equipe"
                      : "Minha comissão do dia"}
                  </dt>
                  <dd>{currency(commissions)}</dd>
                  <small>Comissão de {Math.round(commissionRate * 1000) / 10}%</small>
                </div>
              </dl>
              <Agenda
                {...agendaProps}
                preview
                onSeeAll={() => navigate("agenda")}
              />
              <Production
                appointments={dayAppointments}
                stylistId={stylistId}
                role={role}
                commissionRate={commissionRate}
                compact
                onSeeAll={
                  role === "dono" ? () => navigate("equipe") : undefined
                }
              />
            </>
          )}
          {section === "agenda" && <Agenda {...agendaProps} />}
          {section === "clientes" && <Clients {...clientProps} />}
          {section === "equipe" && role === "dono" && (
            <Production
              appointments={dayAppointments}
              stylistId={stylistId}
              role={role}
              commissionRate={commissionRate}
            />
          )}
          {section === "fechamento" && (
            <Payroll
              appointments={scopedAppointments}
              date={date}
              role={role}
              stylistId={stylistId}
              commissionRate={commissionRate}
            />
          )}
          {section === "servicos" && <ServiceCatalog />}
          {section === "site" && siteEditor && (
            <SiteEditor
              data={siteEditor}
              today={today}
              appointments={appointments}
              clients={clients}
              exceptions={exceptions}
            />
          )}
          <footer className="lb-workspace-footer">
            <span>Livre Beauty · Feito para cuidar da sua rotina.</span>
            <button
              type="button"
              className="lb-text-button"
              onClick={() => router.refresh()}
            >
              Atualizar agenda
            </button>
          </footer>
        </div>
      </div>
      {editing && (
        <AppointmentForm
          key={editing === "new" ? `new-${date}-${stylistId}` : editing.id}
          appointment={editing === "new" ? null : editing}
          date={date}
          clients={scopedClients}
          appointments={appointments}
          exceptions={exceptions}
          role={role}
          stylistId={stylistId}
          onClose={() => setEditing(null)}
          onSave={saveAppointment}
        />
      )}
    </div>
  );
}
