import { BOOKING_TIME_ZONE, type BookingSlot } from "./booking-shared";

export function bookingWhatsAppHref({
  slot,
  clientName,
  serviceName,
  stylistName,
  durationMinutes,
  salonName,
  phoneNumber,
  code,
}: {
  slot: BookingSlot;
  clientName: string;
  serviceName: string;
  stylistName: string;
  durationMinutes: number;
  salonName: string;
  phoneNumber?: string;
  code?: string;
}): string {
  const start = new Date(slot.startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BOOKING_TIME_ZONE,
    dateStyle: "full",
  }).format(start);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BOOKING_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const singleLine = (value: string) => value.trim().replace(/\s+/g, " ");
  const message = [
    `Olá, equipe ${singleLine(salonName)}! Meu agendamento pelo site está confirmado.`,
    "",
    `Nome: ${singleLine(clientName)}`,
    `Serviço: ${singleLine(serviceName)}`,
    `Profissional: ${singleLine(stylistName)}`,
    `Data: ${date}`,
    `Horário: ${time.format(start)} às ${time.format(end)} (horário de São Paulo)`,
    `Duração prevista: ${durationMinutes} minutos`,
    ...(code ? [`Código da reserva: ${code}`] : []),
    "",
    "Até lá!",
  ].join("\n");
  const digits = phoneNumber?.replace(/\D/g, "") ?? "";
  const recipient = /^[1-9]\d{9,14}$/.test(digits) ? digits : "";
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}
