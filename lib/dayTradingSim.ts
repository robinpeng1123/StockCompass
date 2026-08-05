import { generateProjectionPath } from "./projectionPath";

export type HourlyCheckpoint = {
  label: string;
  price: number;
  isNow?: boolean;
};

export type DayTradingSimResult = {
  sessionLabel: string;
  isMarketOpenNow: boolean;
  checkpoints: HourlyCheckpoint[];
};

const OPEN_MIN = 9 * 60 + 30;
const CLOSE_MIN = 16 * 60;

function etParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  return { hour, minute: Number(get("minute")), weekday: get("weekday"), monthDay: `${get("month")} ${get("day")}` };
}

function isWeekend(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

function nextSessionDate(now: Date): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + 1);
  while (isWeekend(etParts(d).weekday)) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function formatMinutes(totalMin: number): string {
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * An hourly, illustrative intraday path from now (or the next open) to
 * market close (4:00 PM ET) — the same seeded Brownian-bridge technique the
 * Prediction Simulator uses, just at hourly resolution over a single
 * session instead of weekly resolution over a month. Volatility is derived
 * from the stock's own daily volatility score; drift comes from the
 * Neutral scenario's monthly midpoint, spread evenly across ~21 trading
 * days. Stable all session (reseeds only when the session/date changes).
 */
export function buildDayTradingSim({
  ticker,
  currentPrice,
  volatilityScore,
  neutralMidpointPct,
  now = new Date(),
}: {
  ticker: string;
  currentPrice: number;
  volatilityScore: number;
  neutralMidpointPct: number;
  now?: Date;
}): DayTradingSimResult {
  const parts = etParts(now);
  const minutesNow = parts.hour * 60 + parts.minute;
  const marketOpenNow = !isWeekend(parts.weekday) && minutesNow >= OPEN_MIN && minutesNow < CLOSE_MIN;

  let startMinutes: number;
  let dateKey: string;
  let sessionLabel: string;

  if (marketOpenNow) {
    startMinutes = Math.min(CLOSE_MIN, Math.ceil(minutesNow / 60) * 60);
    dateKey = now.toISOString().slice(0, 10);
    sessionLabel = "Rest of today's session";
  } else if (!isWeekend(parts.weekday) && minutesNow < OPEN_MIN) {
    startMinutes = OPEN_MIN;
    dateKey = now.toISOString().slice(0, 10);
    sessionLabel = "Today's session (opens 9:30 AM ET)";
  } else {
    const next = nextSessionDate(now);
    startMinutes = OPEN_MIN;
    dateKey = next.toISOString().slice(0, 10);
    sessionLabel = `Markets closed — next session ${etParts(next).monthDay}`;
  }

  const hourLabels: string[] = [];
  for (let m = startMinutes; m <= CLOSE_MIN; m += 60) hourLabels.push(formatMinutes(m));
  if (hourLabels[hourLabels.length - 1] !== formatMinutes(CLOSE_MIN)) hourLabels.push(formatMinutes(CLOSE_MIN));

  const steps = hourLabels.length - 1;
  const dailyVolPct = Math.min(5, Math.max(0.3, volatilityScore / 20));
  const hourlyVolPct = dailyVolPct / Math.sqrt(6.5); // volatility scales with sqrt(time)
  const dailyDriftPct = neutralMidpointPct / 21; // ~21 trading days per month
  const endPrice = currentPrice * (1 + dailyDriftPct / 100);

  const path =
    steps > 0
      ? generateProjectionPath({
          ticker: `${ticker}:daytrading`,
          dateKey,
          startPrice: currentPrice,
          endPrice,
          days: steps,
          dailyVolatilityPct: hourlyVolPct,
        })
      : [currentPrice];

  const checkpoints: HourlyCheckpoint[] = hourLabels.map((label, i) => ({
    label,
    price: path[i] ?? path[path.length - 1],
    isNow: i === 0 && marketOpenNow,
  }));

  return { sessionLabel, isMarketOpenNow: marketOpenNow, checkpoints };
}
