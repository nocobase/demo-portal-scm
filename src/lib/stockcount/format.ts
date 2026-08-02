export function formatNumber(
  value: number | string | null | undefined,
  locale = "en-US"
): string {
  if (value === null || value === undefined || value === "") return "-";
  const number = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(number)) return "-";
  return new Intl.NumberFormat(locale).format(number);
}

export function formatDate(value?: string | null, locale = "en-US"): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
