"use client";

import { useEffect, useState } from "react";

function format(date: Date): string {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${day}, ${dateStr} · ${time}`;
}

export function DateTimeDisplay() {
  const [display, setDisplay] = useState(() => format(new Date()));

  useEffect(() => {
    const tick = () => setDisplay(format(new Date()));
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return <p className="text-muted-foreground mb-6">{display}</p>;
}
