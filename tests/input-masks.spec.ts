import { expect, test } from "@playwright/test";
import {
  formatCurrencyInput,
  formatCurrencyValue,
  formatPhoneInput,
  parseCurrencyInput,
} from "../lib/input-masks";
import { validateContactDetails } from "../lib/booking-shared";

test("masked phones retain the existing contact validation and national numbers", () => {
  for (const [raw, formatted] of [
    ["11999998888", "(11) 99999-8888"],
    ["1133334444", "(11) 3333-4444"],
    ["+55 (11) 99999-8888", "(11) 99999-8888"],
    ["+55 (11) 3333-4444", "(11) 3333-4444"],
    ["55999998888", "(55) 99999-8888"],
  ]) {
    const phone = formatPhoneInput(raw);
    expect(phone).toBe(formatted);
    expect(validateContactDetails({ name: "Pessoa Teste", email: "teste@example.com", phone })).toEqual({});
  }
  expect(validateContactDetails({ name: "Pessoa Teste", email: "teste@example.com", phone: formatPhoneInput("123") }).phone).toBeTruthy();
  expect(formatPhoneInput("")).toBe("");
});

test("currency formatting preserves whole reais, cents, zero and the upper limit", () => {
  for (const [raw, amount] of [
    ["180", 180],
    ["180,50", 180.5],
    ["180.50", 180.5],
    ["R$ 1.234,56", 1234.56],
    ["1234", 1234],
    ["1.234", 1234],
    ["1.234.56", 1234.56],
    ["0", 0],
    ["0,05", 0.05],
    ["100000", 100000],
  ] as const) {
    const masked = formatCurrencyInput(raw);
    expect(parseCurrencyInput(masked)).toBe(amount);
    expect(parseCurrencyInput(formatCurrencyValue(amount))).toBe(amount);
  }
  // Invalid/negative/out-of-range amounts remain available to validation.
  expect(parseCurrencyInput("")).toBeNaN();
  expect(parseCurrencyInput(formatCurrencyInput("-180"))).toBe(-180);
  expect(parseCurrencyInput(formatCurrencyInput("100001"))).toBeGreaterThan(100000);
});
