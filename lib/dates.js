// Older tables use `timestamp without time zone`, which PostgREST returns with no "Z".
// `new Date()` would read that as local time and shift it by the UTC offset, so treat a
// value without a zone as UTC.
export function parseDbDate(value) {
  if (!value) return new Date(NaN);
  const s = String(value);
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}

// "Today" / "Yesterday" / "3 days ago" / a date — by calendar day, not by 24-hour blocks.
// `t` and `locale` come from useTranslation(), so the wording follows the site language.
export function formatRelativeDay(value, t, locale, now = new Date()) {
  const d = parseDbDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.max(0, Math.round((startOfDay(now) - startOfDay(d)) / 86400000));
  if (days === 0) return t.today;
  if (days === 1) return t.yesterday;
  if (days < 7) return t.daysAgo(days);
  return d.toLocaleDateString(locale);
}
