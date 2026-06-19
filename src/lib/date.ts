export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isToday(d: Date): boolean {
  const t = startOfDay(new Date());
  const s = startOfDay(d);
  return s.getTime() === t.getTime();
}

export function isPast(d: Date): boolean {
  return d < new Date();
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

export function addWeeks(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 7 * 86_400_000);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(new Date(d).setMonth(d.getMonth() + n));
}

export function maxDate(dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatDistanceToNow(d: Date): string {
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
  const diffWeek = Math.round(diffDay / 7);
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week");
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
  return rtf.format(Math.round(diffDay / 365), "year");
}
