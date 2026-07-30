"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number, minute: number) {
  const minutesOfDay = hour * 60 + minute;
  if (minutesOfDay >= 5 * 60 && minutesOfDay <= 12 * 60) return "Good morning";
  if (minutesOfDay > 12 * 60 && minutesOfDay <= 16 * 60) return "Good afternoon";
  return "Good evening";
}

/**
 * Computed from the viewer's local clock, so it has to run client-side —
 * the server has no idea what timezone the visitor is in.
 */
export function Greeting() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setText(greetingForHour(now.getHours(), now.getMinutes()));
  }, []);

  return <span>{text ?? "Good day"}</span>;
}
