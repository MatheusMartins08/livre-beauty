export function formatPhoneInput(value: string): string {
  const digits = value
    .replace(/\D/g, "")
    .replace(/^55(?=\d{10,11}$)/, "")
    .slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const number = digits.slice(2);
  const split = digits.length === 11 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ""}`;
}

/** Keep whole reais as entered; a comma (or pasted decimal point) starts cents. */
export function formatCurrencyInput(value: string): string {
  let cleaned = value.replace(/[^\d.,-]/g, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  cleaned = cleaned.replace(/-/g, "");
  if (!cleaned) return sign;
  if (cleaned.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  } else {
    const decimal = cleaned.lastIndexOf(".");
    if (decimal !== -1) {
      cleaned = `${cleaned.slice(0, decimal).replace(/\./g, "")},${cleaned.slice(decimal + 1)}`;
    }
  }
  const [whole, ...fraction] = cleaned.split(",");
  const integer = whole.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = fraction.join("").replace(/\D/g, "").slice(0, 2);
  return `${sign}${grouped}${fraction.length ? `,${cents}` : ""}`;
}

export function parseCurrencyInput(value: string): number {
  if (!/^-?\d{1,3}(?:\.\d{3})*(?:,\d{0,2})?$/.test(value)) return NaN;
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
