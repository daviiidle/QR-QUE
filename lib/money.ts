export function formatMoney(cents: number, currency = "AUD", locale = "en-AU") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatOrderNumber(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}
