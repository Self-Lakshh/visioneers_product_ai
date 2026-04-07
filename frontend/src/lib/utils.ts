import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely — resolves conflicts via tailwind-merge,
 * handles conditional classes via clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a score display string (e.g., "8.4 / 10").
 */
export function formatScore(score: number): string {
  return `${score.toFixed(1)} / 10`;
}

/**
 * Return a Tailwind color class based on a 0–10 score.
 */
export function scoreColor(score: number): string {
  if (score >= 8.5) return "text-emerald-400";
  if (score >= 7.0) return "text-teal-400";
  if (score >= 5.5) return "text-amber-400";
  return "text-red-400";
}

/**
 * Return a verdict display label.
 */
export const VERDICT_LABELS: Record<string, string> = {
  strong_buy: "Strong Buy",
  buy:        "Buy",
  hold:       "Hold",
  avoid:      "Avoid",
};

export const VERDICT_COLORS: Record<string, string> = {
  strong_buy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  buy:        "text-teal-400   bg-teal-400/10   border-teal-400/30",
  hold:       "text-amber-400  bg-amber-400/10  border-amber-400/30",
  avoid:      "text-red-400    bg-red-400/10    border-red-400/30",
};

/**
 * Format a price to USD string.
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Truncate a URL for display.
 */
export function truncateUrl(url: string, maxLen = 50): string {
  try {
    const { hostname, pathname } = new URL(url);
    const short = hostname + pathname;
    return short.length > maxLen ? short.slice(0, maxLen) + "…" : short;
  } catch {
    return url.slice(0, maxLen);
  }
}
