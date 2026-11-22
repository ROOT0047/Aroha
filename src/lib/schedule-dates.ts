import { addDays, format, isValid, parseISO, startOfWeek } from "date-fns";

export function isScheduleDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISO(value);
  return isValid(date) && format(date, "yyyy-MM-dd") === value;
}

export function scheduleDates(base: string, options: { weekdays?: number[]; weeks?: number; days?: number } = {}): string[] {
  if (!isScheduleDate(base)) throw new Error("Pick a valid date");
  const date = parseISO(base);
  const weekdays = [...new Set(options.weekdays ?? [])];
  if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error("Pick valid weekdays");
  if (weekdays.length) {
    const weeks = Math.max(1, Math.min(8, Math.trunc(options.weeks ?? 1)));
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: weeks }, (_, week) => weekdays.map((day) => format(addDays(monday, week * 7 + day), "yyyy-MM-dd")))
      .flat().filter((day) => day >= base).sort();
  }
  const days = Math.max(1, Math.min(30, Math.trunc(options.days ?? 1)));
  return Array.from({ length: days }, (_, day) => format(addDays(date, day), "yyyy-MM-dd"));
}

export const scheduleTime = /^([01]\d|2[0-3]):[0-5]\d$/;