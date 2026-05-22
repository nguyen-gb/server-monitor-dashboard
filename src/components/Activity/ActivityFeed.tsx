import {
  PlusCircle,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw,
  Edit3,
  Activity,
} from "lucide-react";
import type { Activity as ActivityType, ActivityAction } from "@/types/server";
import { formatRelativeTime, formatTimestamp } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: ActivityType[];
}

function getActionIcon(action: ActivityAction) {
  const iconClass = "h-3.5 w-3.5";
  switch (action) {
    case "created": return <PlusCircle className={iconClass} />;
    case "went_online": return <Wifi className={iconClass} />;
    case "went_offline": return <WifiOff className={iconClass} />;
    case "removed": return <Trash2 className={iconClass} />;
    case "updated": return <RefreshCw className={iconClass} />;
    case "changed_alias": return <Edit3 className={iconClass} />;
    default: return <Activity className={iconClass} />;
  }
}

function getActionStyle(action: ActivityAction): { color: string; bg: string } {
  switch (action) {
    case "created":
    case "went_online":
      return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    case "went_offline":
    case "removed":
      return { color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    case "updated":
      return { color: "#ea3b92", bg: "rgba(234,59,146,0.1)" };
    case "changed_alias":
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    default:
      return { color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  }
}

function getActionText(action: ActivityAction): string {
  switch (action) {
    case "created": return "was created";
    case "went_online": return "went online";
    case "went_offline": return "went offline";
    case "removed": return "was removed";
    case "updated": return "was updated";
    case "changed_alias": return "changed alias";
    default: return action;
  }
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed]/10">
            <Activity className="h-4 w-4 text-[#7c3aed]" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
        </div>
        <span className="rounded-full bg-[#7c3aed]/10 px-2.5 py-1 text-[10px] font-bold text-[#7c3aed]">
          {activities.length} events
        </span>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto pr-1" style={{ maxHeight: "340px" }}>
        {activities.map((activity, index) => {
          const style = getActionStyle(activity.action);
          return (
            <div
              key={activity.id}
              className={cn(
                "group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-secondary/50",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${Math.min(index * 25, 500)}ms` }}
            >
              {/* Icon */}
              <div
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {getActionIcon(activity.action)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed">
                  <span className="font-bold text-foreground">{activity.serverName}</span>{" "}
                  <span className="text-muted-foreground">{getActionText(activity.action)}</span>
                </p>
                <time
                  className="mt-0.5 block text-[10px] font-medium text-muted-foreground/70"
                  title={formatTimestamp(activity.timestamp)}
                >
                  {formatRelativeTime(activity.timestamp)}
                </time>
              </div>

              {/* Time dot */}
              <div
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full opacity-60"
                style={{ backgroundColor: style.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
