import { services, stylists } from "@/content/salon";
import type { SalonCatalog } from "./catalog";
import {
  blocksForDate,
  defaultOpeningPeriods,
  periodsForDate,
  toMinutes,
  type ScheduleException,
} from "./opening-hours";

export type AdminRole = "dono" | "funcionario";
export type AdminSection =
  | "visao"
  | "agenda"
  | "clientes"
  | "equipe"
  | "fechamento"
  | "servicos"
  | "site"
  | "horario";
export type AppointmentStatus =
  "agendado" | "concluido" | "faltou" | "cancelado";
export type PaymentMethod = "pix" | "cartao" | "dinheiro";
export type Period = "dia" | "semana" | "mes";

export interface AdminClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  /** Consent to WhatsApp messages from the salon (LGPD), with its date. */
  whatsappOptIn: boolean;
  whatsappOptInAt: string | null;
}

export interface AdminAppointment {
  id: string;
  /** Reservation code given to the client; empty until the database assigns it. */
  code: string;
  /** Cancelled by the client on the site, with the reservation code. */
  cancelledByClient: boolean;
  date: string;
  time: string;
  clientId: string;
  /** First service; kept for code that reads a single service. */
  serviceId: string;
  /** Every service, in the order performed. */
  serviceIds: string[];
  /** Names stored at booking time, so renamed or archived services still read well. */
  serviceNames: string[];
  bookedWith: string | null;
  performedBy: string;
  status: AppointmentStatus;
  price: number;
  paymentMethod: PaymentMethod | null;
  notes: string;
  durationMinutes?: number;
}

// Used when the salon's configured rate is unavailable (salon_settings default).
export const defaultCommissionRate = 0.5;
/** Months of history the owner may keep; the database accepts 6 to 120. */
export const retentionOptions = [6, 12, 24, 36, 60] as const;

export const statusLabels: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  faltou: "Não compareceu",
  cancelado: "Cancelado",
};
export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};
export const sectionLabels: Record<AdminSection, string> = {
  visao: "Visão geral",
  agenda: "Agenda",
  clientes: "Clientes",
  equipe: "Equipe",
  fechamento: "Fechamento",
  servicos: "Serviços",
  site: "Edição do site",
  horario: "Meu horário",
};

export function salonToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDate(date: string, long = false) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    long
      ? { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }
      : { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" },
  ).format(new Date(`${date}T12:00:00Z`));
}

export function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getPeriodRange(date: string, period: Period) {
  if (period === "dia") return { start: date, end: date };
  if (period === "semana") {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const start = addDays(date, -((weekday + 6) % 7));
    return { start, end: addDays(start, 6) };
  }
  const start = `${date.slice(0, 7)}-01`;
  const next = new Date(`${start}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: addDays(next.toISOString().slice(0, 10), -1) };
}

export function charge(appointment: AdminAppointment) {
  return appointment.price;
}
export function payout(
  appointment: AdminAppointment,
  rate = defaultCommissionRate,
) {
  return appointment.status === "concluido" ? appointment.price * rate : 0;
}
export function serviceLabel(appointment: AdminAppointment) {
  return appointment.serviceNames.join(" + ");
}
export function isClosed(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 1;
}
export function timeInMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function appointmentError(
  appointment: AdminAppointment,
  appointments: AdminAppointment[],
  catalog?: SalonCatalog,
  exceptions: ScheduleException[] = [],
) {
  if (appointment.status !== "agendado" && appointment.status !== "concluido")
    return null;
  const periods = periodsForDate(
    appointment.date,
    catalog?.openingPeriods ?? defaultOpeningPeriods,
    exceptions,
  );
  const start = timeInMinutes(appointment.time);
  const serviceCatalog = catalog?.services ?? services;
  const catalogDuration = (ids: string[]) =>
    ids.reduce<number | undefined>((sum, id) => {
      const duration = serviceCatalog.find((item) => item.id === id)?.duration;
      return sum === undefined || duration === undefined ? undefined : sum + duration;
    }, 0);
  const previous = appointments.find((item) => item.id === appointment.id);
  const sameSchedule =
    previous &&
    previous.date === appointment.date &&
    previous.time === appointment.time &&
    previous.serviceIds.join("+") === appointment.serviceIds.join("+") &&
    previous.performedBy === appointment.performedBy &&
    (previous.status === "agendado" || previous.status === "concluido") &&
    previous.durationMinutes === appointment.durationMinutes;
  if (!sameSchedule && !periods.length)
    return "Escolha um dia de funcionamento do ateliê.";
  const duration =
    appointment.durationMinutes ?? catalogDuration(appointment.serviceIds);
  if (!duration) return "Escolha um serviço disponível.";
  const end = start + duration;
  if (
    !sameSchedule &&
    !periods.some(
      (period) =>
        start >= toMinutes(period.opens_at) && end <= toMinutes(period.closes_at),
    )
  )
    return "O atendimento deve começar e terminar dentro do horário de funcionamento.";
  if (
    !sameSchedule &&
    blocksForDate(appointment.date, exceptions, catalog?.stylistPeriods).some(
      (block) =>
        (block.stylistId === null || block.stylistId === appointment.performedBy) &&
        start < block.end &&
        end > block.start,
    )
  )
    return "O profissional está indisponível nesse horário.";
  const conflict = appointments.some((item) => {
    if (
      item.id === appointment.id ||
      item.date !== appointment.date ||
      (item.performedBy !== appointment.performedBy &&
        item.clientId !== appointment.clientId) ||
      (item.status !== "agendado" && item.status !== "concluido")
    )
      return false;
    return (
      start <
        timeInMinutes(item.time) +
          (item.durationMinutes ?? catalogDuration(item.serviceIds) ?? 0) &&
      end > timeInMinutes(item.time)
    );
  });
  return conflict
    ? "Esse horário se sobrepõe a outro atendimento do profissional ou do cliente. Escolha outro horário."
    : null;
}

export function createDemoClients(): AdminClient[] {
  const names = [
    "Camila Ribeiro",
    "Beatriz Martins",
    "Ana Paula Santos",
    "Juliana Almeida",
    "Fernanda Lima",
    "Isabela Costa",
    "Mariana Rocha",
    "Clara Oliveira",
    "Laura Mendes",
    "Gabriela Souza",
    "Renata Dias",
    "Luiza Ferreira",
  ];
  return names.map((name, i) => ({
    id: `cliente-${i + 1}`,
    name,
    phone: `(11) 90000-${String(i + 1).padStart(4, "0")}`,
    email: `cliente${i + 1}@example.com`,
    notes:
      i === 0
        ? "Prefere acabamento natural. Confirmar referências antes do corte."
        : "",
    whatsappOptIn: false,
    whatsappOptInAt: null,
  }));
}

export function createDemoAppointments(today: string): AdminAppointment[] {
  const result: AdminAppointment[] = [];
  const clients = createDemoClients();
  for (let day = -12; day <= 7; day++) {
    const date = addDays(today, day);
    if (isClosed(date)) continue;
    stylists.forEach((stylist, index) => {
      // Valid, non-overlapping appointments aligned with each stylist's specialties.
      const serviceIds = [
        stylist.serviceIds[0],
        "tratamento",
        stylist.serviceIds.at(-1)!,
      ];
      const times = ["09:00", "13:00", "16:00"];
      serviceIds.forEach((serviceId, slot) => {
        const service = services.find((item) => item.id === serviceId)!;
        const clientIndex = (index * 3 + slot + Math.abs(day)) % 12;
        const client = clients[clientIndex];
        result.push({
          id: `${date}-${stylist.id}-${slot}`,
          code: "",
          cancelledByClient: false,
          date,
          time: times[slot],
          clientId: client.id,
          serviceId,
          serviceIds: [serviceId],
          serviceNames: [service.name],
          bookedWith: stylist.id,
          performedBy: stylist.id,
          status:
            day < 0
              ? day === -3 && slot === 2
                ? "faltou"
                : "concluido"
              : day === 0 && slot === 0
                ? "concluido"
                : "agendado",
          price: service.price,
          paymentMethod: "pix",
          notes: "",
        });
      });
    });
  }
  return result;
}

/** Escapes spreadsheet formula prefixes as well as separators and quotes. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(";"),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
