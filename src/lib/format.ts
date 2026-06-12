/** Formats a duration in seconds as a compact "Xh Ym" / "Ym" / "<1m" string. */
export function formatSeconds(seconds: number): string {
  return formatMinutes(Math.floor(Math.max(0, seconds) / 60));
}

/** Formats elapsed milliseconds the same way. */
export function formatElapsed(ms: number): string {
  return formatMinutes(Math.floor(Math.max(0, ms) / 60_000));
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 1) {
    return "<1m";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/** Milliseconds elapsed since an ISO-8601 timestamp, clamped at zero. */
export function elapsedSince(startedAt: string): number {
  const startedMs = Date.parse(startedAt);
  if (!Number.isFinite(startedMs)) {
    return 0;
  }
  return Math.max(0, Date.now() - startedMs);
}
