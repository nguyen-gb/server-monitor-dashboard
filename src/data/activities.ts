import type { Activity, ActivityAction } from "@/types/server";
import { servers } from "./servers";

const actions: { action: ActivityAction; message: string }[] = [
  { action: "created", message: "was created" },
  { action: "went_online", message: "went online" },
  { action: "went_offline", message: "went offline" },
  { action: "updated", message: "was updated" },
  { action: "changed_alias", message: "changed alias" },
  { action: "removed", message: "was removed" },
];

function generateActivities(count: number = 50): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const server = servers[Math.floor(Math.random() * servers.length)];
    const actionItem = actions[Math.floor(Math.random() * actions.length)];

    // Activities spread over last 30 days
    const hoursAgo = Math.floor(Math.random() * 720); // up to 30 days
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    activities.push({
      id: `act-${(i + 1).toString().padStart(3, "0")}`,
      timestamp: timestamp.toISOString(),
      serverName: server.hostname,
      action: actionItem.action,
      details: actionItem.message,
    });
  }

  // Sort by timestamp descending (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const activities: Activity[] = generateActivities(50);

export function getActionColor(action: ActivityAction): string {
  switch (action) {
    case "created":
      return "text-success";
    case "went_online":
      return "text-success";
    case "went_offline":
      return "text-danger";
    case "removed":
      return "text-danger";
    case "updated":
      return "text-primary";
    case "changed_alias":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

export function getActionIcon(action: ActivityAction): string {
  switch (action) {
    case "created":
      return "plus-circle";
    case "went_online":
      return "wifi";
    case "went_offline":
      return "wifi-off";
    case "removed":
      return "trash-2";
    case "updated":
      return "refresh-cw";
    case "changed_alias":
      return "edit-3";
    default:
      return "activity";
  }
}
