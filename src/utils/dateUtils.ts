import { parse, isWithinInterval, subDays, subWeeks, subMonths, format } from "date-fns";
import type { TimeFilter } from "@/types/server";

/**
 * Parse DD/MM/YYYY HH:mm:ss format to Date object
 */
export function parseDateString(dateStr: string): Date {
  return parse(dateStr, "dd/MM/yyyy HH:mm:ss", new Date());
}

/**
 * Format a Date to display string
 */
export function formatDisplayDate(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm:ss");
}

/**
 * Format ISO string to relative time display
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, "dd MMM yyyy");
}

/**
 * Format ISO timestamp to display format
 */
export function formatTimestamp(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd HH:mm:ss");
}

/**
 * Get date range from TimeFilter
 */
export function getDateRange(filter: TimeFilter): { start: Date; end: Date } {
  const now = new Date();

  switch (filter.range) {
    case "24h":
      return { start: subDays(now, 1), end: now };
    case "week":
      return { start: subWeeks(now, 1), end: now };
    case "month":
      return { start: subMonths(now, 1), end: now };
    case "custom":
      return {
        start: filter.startDate || subMonths(now, 1),
        end: filter.endDate || now,
      };
  }
}

/**
 * Check if a date string (DD/MM/YYYY HH:mm:ss) is within a TimeFilter range
 */
export function isWithinTimeFilter(dateStr: string, filter: TimeFilter): boolean {
  const date = parseDateString(dateStr);
  const { start, end } = getDateRange(filter);
  return isWithinInterval(date, { start, end });
}
