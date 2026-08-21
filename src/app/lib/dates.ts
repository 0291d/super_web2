export function isValidDateValue(value?: string | null) {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function formatDate(value?: string | null, fallback = 'Not set', locale = 'en-US') {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
