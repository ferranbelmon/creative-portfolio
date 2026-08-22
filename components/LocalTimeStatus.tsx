"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "Europe/Madrid";
const PLACE = "BCN";

function formatOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return raw.replace(/\s+/g, "");

  const sign = match[1];
  const hours = String(Number.parseInt(match[2], 10));
  const minutes = match[3] && match[3] !== "00" ? `:${match[3]}` : "";
  return `GMT${sign}${hours}${minutes}`;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatYear(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
  }).format(date);
}

type LocalTimeStatusProps = {
  className?: string;
};

export function LocalTimeStatus({ className = "" }: LocalTimeStatusProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return (
      <span
        className={`font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted tabular-nums md:text-sm md:tracking-[0.14em] ${className}`}
      >
        —
      </span>
    );
  }

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={`font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted tabular-nums md:text-sm md:tracking-[0.14em] ${className}`}
    >
      {formatOffset(now)} {PLACE} {formatClock(now)} {formatYear(now)}
    </span>
  );
}
