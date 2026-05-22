import type { Server, TimeFilter } from "@/types/server";
import { parseDateString, getDateRange } from "./dateUtils";
import { isWithinInterval, eachDayOfInterval, format } from "date-fns";

/**
 * Count servers by a specific field
 */
export function countByField(servers: Server[], field: keyof Server): Record<string, number> {
  const counts: Record<string, number> = {};
  servers.forEach((server) => {
    const key = String(server[field]);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/**
 * Get top N items from a count record, sorted descending
 */
export function getTopItems(counts: Record<string, number>, topN: number = 5): { name: string; value: number }[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

/**
 * Filter servers by time filter (based on createdTime)
 */
export function filterServersByTime(servers: Server[], filter: TimeFilter): Server[] {
  const { start, end } = getDateRange(filter);
  return servers.filter((server) => {
    const created = parseDateString(server.createdTime);
    return isWithinInterval(created, { start, end });
  });
}

/**
 * Count new servers within the time filter
 */
export function countNewServers(servers: Server[], filter: TimeFilter): number {
  return filterServersByTime(servers, filter).length;
}

/**
 * Get server count per day for timeline chart
 */
export function getServerTimeline(servers: Server[], filter: TimeFilter): { date: string; total: number; newServers: number }[] {
  const { start, end } = getDateRange(filter);
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const dayStr = format(day, "MMM dd");
    const total = servers.filter((s) => {
      const created = parseDateString(s.createdTime);
      return created <= day;
    }).length;
    const newServers = servers.filter((s) => {
      const created = parseDateString(s.createdTime);
      return format(created, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
    }).length;
    return { date: dayStr, total, newServers };
  });
}

/**
 * Group servers by location for globe clustering
 */
export function groupServersByLocation(servers: Server[]): {
  lat: number;
  lng: number;
  count: number;
  servers: Server[];
  country: string;
}[] {
  const groups: { lat: number; lng: number; servers: Server[]; country: string }[] = [];

  servers.forEach((server) => {
    // Proximity threshold of 4.0 degrees merges servers in the same metropolitan/regional zone
    const threshold = 4.0;
    const existingGroup = groups.find((g) => {
      return (
        Math.abs(g.lat - server.lat) < threshold &&
        Math.abs(g.lng - server.lng) < threshold &&
        g.country === server.country
      );
    });

    if (existingGroup) {
      existingGroup.servers.push(server);
    } else {
      groups.push({
        lat: server.lat,
        lng: server.lng,
        servers: [server],
        country: server.country,
      });
    }
  });

  // Calculate the average coordinates for the cluster
  groups.forEach((g) => {
    g.lat = g.servers.reduce((sum, s) => sum + s.lat, 0) / g.servers.length;
    g.lng = g.servers.reduce((sum, s) => sum + s.lng, 0) / g.servers.length;
  });

  return groups.map((g) => ({
    ...g,
    count: g.servers.length,
  }));
}
