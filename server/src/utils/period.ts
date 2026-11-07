import type { SnapshotTimeframe } from "../types/types.js";

export const SNAPSHOT_TIMEFRAMES: readonly SnapshotTimeframe[] = [
  "daily",
  "weekly",
];

const DAY_MS = 86_400_000;

const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const startOfIsoWeek = (date: Date): Date => {
  const day = startOfUtcDay(date);
  const dayOfWeek = day.getUTCDay() || 7;
  return new Date(day.getTime() - (dayOfWeek - 1) * DAY_MS);
};

export const dailyPeriodKey = (date: Date): string =>
  date.toISOString().slice(0, 10);

export const weeklyPeriodKey = (date: Date): string => {
  const monday = startOfIsoWeek(date);
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  const isoYear = thursday.getUTCFullYear();
  const firstThursdayWeekStart = startOfIsoWeek(
    new Date(Date.UTC(isoYear, 0, 4)),
  );
  const week =
    Math.round(
      (monday.getTime() - firstThursdayWeekStart.getTime()) / (7 * DAY_MS),
    ) + 1;

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
};

export const periodKeyFor = (
  timeframe: SnapshotTimeframe,
  date: Date,
): string =>
  timeframe === "daily" ? dailyPeriodKey(date) : weeklyPeriodKey(date);

export const periodBounds = (
  timeframe: SnapshotTimeframe,
  periodKey: string,
): { start: Date; end: Date } | null => {
  if (timeframe === "daily") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
      return null;
    }

    const start = new Date(`${periodKey}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime()) || dailyPeriodKey(start) !== periodKey) {
      return null;
    }

    return { start, end: new Date(start.getTime() + DAY_MS) };
  }

  const match = /^(\d{4})-W(\d{2})$/.exec(periodKey);

  if (!match) {
    return null;
  }

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  const firstWeekStart = startOfIsoWeek(new Date(Date.UTC(isoYear, 0, 4)));
  const start = new Date(firstWeekStart.getTime() + (week - 1) * 7 * DAY_MS);

  if (week < 1 || weeklyPeriodKey(start) !== periodKey) {
    return null;
  }

  return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
};

export const isValidPeriodKey = (
  timeframe: SnapshotTimeframe,
  periodKey: string,
): boolean => periodBounds(timeframe, periodKey) !== null;

export const closedPeriodKey = (
  timeframe: SnapshotTimeframe,
  now: Date,
  stepsBack = 0,
): string => {
  const currentStart =
    timeframe === "daily" ? startOfUtcDay(now) : startOfIsoWeek(now);
  const length = timeframe === "daily" ? DAY_MS : 7 * DAY_MS;

  return periodKeyFor(
    timeframe,
    new Date(currentStart.getTime() - length * (stepsBack + 1) + length / 2),
  );
};
