"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { BOOKING_TIME_ZONE } from "@/lib/booking-shared";
import styles from "./booking.module.css";

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BOOKING_TIME_ZONE,
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BOOKING_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function BookingCalendar({
  dates,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  invalid: boolean;
  describedBy: string;
}) {
  const months = [...new Set(dates.map((day) => day.slice(0, 7)))];
  const [visibleMonth, setVisibleMonth] = useState(
    (value || dates[0] || "").slice(0, 7),
  );
  if (!dates.length)
    return (
      <p role="status">
        A agenda não tem dias disponíveis no momento. Tente novamente mais
        tarde.
      </p>
    );
  const month = months.includes(visibleMonth) ? visibleMonth : months[0];
  const monthIndex = months.indexOf(month);
  const firstDay = new Date(`${month}-01T12:00:00Z`);
  const year = firstDay.getUTCFullYear();
  const monthNumber = firstDay.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthNumber + 1, 0)).getUTCDate();
  const leadingDays = (firstDay.getUTCDay() + 6) % 7;
  const availableDates = new Set(dates);
  const focusDate =
    availableDates.has(value) && value.startsWith(month)
      ? value
      : dates.find((day) => day.startsWith(month));
  const monthLabel = monthFormatter.format(firstDay);

  return (
    <fieldset
      className={`${styles.choiceFieldset} ${styles.calendar}`}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    >
      <legend className={styles.calendarLegend}>
        Qual dia combina com você?
      </legend>
      <div className={styles.calendarHeader}>
        <p aria-live="polite" aria-atomic="true">
          {monthLabel.charAt(0).toLocaleUpperCase("pt-BR") +
            monthLabel.slice(1)}
        </p>
        <div className={styles.calendarNavigation}>
          <button
            type="button"
            className={styles.calendarArrow}
            aria-label="Mês anterior"
            disabled={monthIndex === 0}
            onClick={() => setVisibleMonth(months[monthIndex - 1])}
          >
            <CaretLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.calendarArrow}
            aria-label="Próximo mês"
            disabled={monthIndex === months.length - 1}
            onClick={() => setVisibleMonth(months[monthIndex + 1])}
          >
            <CaretRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {weekdays.map((day) => (
          <span key={day} className={styles.calendarWeekday} aria-hidden="true">
            {day}
          </span>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const number = index + 1;
          const day = `${month}-${String(number).padStart(2, "0")}`;
          const label = dayFormatter.format(new Date(`${day}T12:00:00Z`));
          if (!availableDates.has(day)) {
            return (
              <span
                key={day}
                className={styles.calendarUnavailable}
                aria-hidden="true"
              >
                {number}
              </span>
            );
          }
          return (
            <label
              key={day}
              className={`${styles.calendarDay} ${value === day ? styles.calendarSelected : ""}`}
            >
              <input
                type="radio"
                name="booking-day"
                required
                value={day}
                checked={value === day}
                onChange={() => onChange(day)}
                aria-label={label}
                aria-describedby={describedBy}
                id={day === focusDate ? "booking-date" : undefined}
              />
              <span aria-hidden="true">{number}</span>
            </label>
          );
        })}
      </div>
      <p className={styles.calendarHint}>
        Dias em cinza estão fora da agenda. Escolha um dos dias disponíveis.
      </p>
      {value && (
        <p className={styles.calendarSelection} role="status">
          Seu dia:{" "}
          <strong>{dayFormatter.format(new Date(`${value}T12:00:00Z`))}</strong>
        </p>
      )}
    </fieldset>
  );
}
