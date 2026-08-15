/**
 * Real US equity market hours (9:30 AM–4:00 PM ET, weekdays), computed from
 * the actual current time — not simulated. Shared by the Day Trading Sim
 * (lib/dayTradingSim.ts) and the dashboard's Market Schedule widget so both
 * agree on what "open" means and don't duplicate the timezone-aware logic.
 */

export const OPEN_MIN = 9 * 60 + 30;
export const CLOSE_MIN = 16 * 60;

export function etParts(date: Date) {
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

export function isWeekend(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

export function nextSessionDate(now: Date): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + 1);
  while (isWeekend(etParts(d).weekday)) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export function formatMinutes(totalMin: number): string {
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export type MarketStatus = {
  isOpen: boolean;
  weekday: string;
  monthDay: string;
  minutesNow: number;
  /** Minutes remaining until close, only meaningful when isOpen. */
  minutesUntilClose: number;
  /** Minutes remaining until the next open, only meaningful when !isOpen. */
  minutesUntilOpen: number;
  /** 0-100, how far through today's regular session the current time is (0/100 when closed). */
  sessionProgressPct: number;
  nextOpenLabel: string;
};

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const parts = etParts(now);
  const minutesNow = parts.hour * 60 + parts.minute;
  const isOpen = !isWeekend(parts.weekday) && minutesNow >= OPEN_MIN && minutesNow < CLOSE_MIN;

  const sessionProgressPct = isOpen ? Math.round(((minutesNow - OPEN_MIN) / (CLOSE_MIN - OPEN_MIN)) * 100) : 0;

  let nextOpenLabel: string;
  let minutesUntilOpen = 0;
  if (isOpen) {
    nextOpenLabel = "";
  } else if (!isWeekend(parts.weekday) && minutesNow < OPEN_MIN) {
    nextOpenLabel = `Today at ${formatMinutes(OPEN_MIN)} ET`;
    minutesUntilOpen = OPEN_MIN - minutesNow;
  } else {
    const next = nextSessionDate(now);
    const nextParts = etParts(next);
    nextOpenLabel = `${nextParts.monthDay} at ${formatMinutes(OPEN_MIN)} ET`;
    // Minutes from now until next session's open, spanning midnight(s).
    const minutesToMidnight = 24 * 60 - minutesNow;
    const daysBetween = Math.round((next.getTime() - now.getTime()) / 86_400_000) - 1;
    minutesUntilOpen = minutesToMidnight + Math.max(0, daysBetween) * 24 * 60 + OPEN_MIN;
  }

  return {
    isOpen,
    weekday: parts.weekday,
    monthDay: parts.monthDay,
    minutesNow,
    minutesUntilClose: isOpen ? CLOSE_MIN - minutesNow : 0,
    minutesUntilOpen,
    sessionProgressPct,
    nextOpenLabel,
  };
}
