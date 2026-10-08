// Weekly periods and dated exceptions, shared by the site, booking and panel.
// The database applies the same precedence: closed > special hours > weekly.

export interface OpeningPeriod {
  weekday: number;
  opens_at: string;
  closes_at: string;
}
export interface DayPeriod {
  opens_at: string;
  closes_at: string;
}
export type ExceptionKind = "fechado" | "horario_especial" | "bloqueio";
export interface ScheduleException {
  id: string;
  kind: ExceptionKind;
  stylistId: string | null;
  startsOn: string;
  endsOn: string;
  opensAt: string | null;
  closesAt: string | null;
  reason: string;
}

export const weekdayNames = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];
/** Monday-first order used in texts and in the editor. */
export const weekOrder = [1, 2, 3, 4, 5, 6, 0];
export const exceptionLabels: Record<ExceptionKind, string> = {
  fechado: "Fechado",
  horario_especial: "Horário especial",
  bloqueio: "Bloqueio de horário",
};

// Tuesday to Saturday, 09:00–19:00: the hours published before the editor.
export const defaultOpeningPeriods: OpeningPeriod[] = [2, 3, 4, 5, 6].map(
  (weekday) => ({ weekday, opens_at: "09:00", closes_at: "19:00" }),
);

/** PostgREST returns "09:00:00"; the app works with "09:00". */
export function shortTime(value: string) {
  return value.slice(0, 5);
}
export function toMinutes(time: string) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}
export function fromMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function periodsOfWeekday(
  weekday: number,
  periods: OpeningPeriod[],
): DayPeriod[] {
  return periods
    .filter((period) => period.weekday === weekday)
    .map(({ opens_at, closes_at }) => ({
      opens_at: shortTime(opens_at),
      closes_at: shortTime(closes_at),
    }))
    .sort((a, b) => a.opens_at.localeCompare(b.opens_at));
}
export function weeklyPeriodsFor(date: string, periods: OpeningPeriod[]) {
  return periodsOfWeekday(weekdayOf(date), periods);
}

function coversDate(exception: ScheduleException, date: string) {
  return exception.startsOn <= date && date <= exception.endsOn;
}

/** Salon periods of one date, applying exceptions like private.day_periods. */
export function periodsForDate(
  date: string,
  periods: OpeningPeriod[],
  exceptions: ScheduleException[] = [],
): DayPeriod[] {
  const current = exceptions.filter((item) => coversDate(item, date));
  if (current.some((item) => item.kind === "fechado" && !item.stylistId))
    return [];
  const special = current.filter((item) => item.kind === "horario_especial");
  if (special.length)
    return special.map((item) => ({
      opens_at: shortTime(item.opensAt!),
      closes_at: shortTime(item.closesAt!),
    }));
  return weeklyPeriodsFor(date, periods);
}

/** Unavailable local time windows of one date; stylistId null blocks everyone. */
export function blocksForDate(
  date: string,
  exceptions: ScheduleException[] = [],
): { stylistId: string | null; start: number; end: number }[] {
  return exceptions
    .filter(
      (item) =>
        coversDate(item, date) &&
        (item.kind === "bloqueio" || (item.kind === "fechado" && item.stylistId)),
    )
    .map((item) =>
      item.kind === "fechado"
        ? { stylistId: item.stylistId, start: 0, end: 24 * 60 }
        : {
            stylistId: item.stylistId,
            start: toMinutes(item.opensAt!),
            end: toMinutes(item.closesAt!),
          },
    );
}

/** Errors for a week edited in the panel; an empty list means it can be saved. */
export function validateWeek(periods: OpeningPeriod[]): string[] {
  const errors: string[] = [];
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const weekday of weekOrder) {
    const day = periods
      .filter((period) => period.weekday === weekday)
      .sort((a, b) => a.opens_at.localeCompare(b.opens_at));
    const name = weekdayNames[weekday];
    if (day.length > 6) errors.push(`Use no máximo 6 períodos na ${name}.`);
    day.forEach((period, index) => {
      if (!time.test(period.opens_at) || !time.test(period.closes_at))
        errors.push(`Confira os horários de ${name}.`);
      else if (period.closes_at <= period.opens_at)
        errors.push(`Em ${name}, o fim deve ser depois do início.`);
      else if (index > 0 && period.opens_at < day[index - 1].closes_at)
        errors.push(`Os períodos de ${name} não podem se sobrepor.`);
    });
  }
  return [...new Set(errors)];
}

function hourLabel(time: string) {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}h${minutes === "00" ? "" : minutes}`;
}
function joinWords(words: string[]) {
  return words.length < 2
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} e ${words.at(-1)}`;
}

/** "Terça a sábado, das 9h às 19h", grouping days that share the same periods. */
export function formatWeeklyHours(periods: OpeningPeriod[]): string {
  const signatures = new Map<string, number[]>();
  for (const weekday of weekOrder) {
    const day = periodsOfWeekday(weekday, periods);
    if (!day.length) continue;
    const signature = joinWords(
      day.map(
        (period) =>
          `das ${hourLabel(period.opens_at)} às ${hourLabel(period.closes_at)}`,
      ),
    );
    signatures.set(signature, [...(signatures.get(signature) ?? []), weekday]);
  }
  if (!signatures.size) return "Horários sob consulta";
  return [...signatures]
    .map(([signature, days]) => {
      const runs: number[][] = [];
      for (const weekday of days) {
        const run = runs.at(-1);
        const previous = run?.at(-1);
        if (
          run &&
          previous !== undefined &&
          weekOrder.indexOf(weekday) === weekOrder.indexOf(previous) + 1
        )
          run.push(weekday);
        else runs.push([weekday]);
      }
      const label = joinWords(
        runs.map((run) =>
          run.length === 1
            ? weekdayNames[run[0]]
            : `${weekdayNames[run[0]]} a ${weekdayNames[run.at(-1)!]}`,
        ),
      );
      return `${label.charAt(0).toLocaleUpperCase("pt-BR")}${label.slice(1)}, ${signature}`;
    })
    .join(" · ");
}

/** schema.org openingHours entries, such as "Tu 09:00-19:00". */
export function structuredOpeningHours(periods: OpeningPeriod[]): string[] {
  const codes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return weekOrder.flatMap((weekday) =>
    periodsOfWeekday(weekday, periods).map(
      (period) => `${codes[weekday]} ${period.opens_at}-${period.closes_at}`,
    ),
  );
}
