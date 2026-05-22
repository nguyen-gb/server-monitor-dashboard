export interface Server {
  id: string;
  ip: string;
  country: string;
  countryCode: string;
  hostname: string;
  os: string;
  version: string;
  platform: string;
  arch: string;
  status: "online" | "offline";
  createdTime: string; // DD/MM/YYYY HH:mm:ss
  lastUpdated: string; // DD/MM/YYYY HH:mm:ss
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  timestamp: string; // ISO format
  serverName: string;
  action: ActivityAction;
  details?: string;
}

export type ActivityAction =
  | "created"
  | "removed"
  | "went_online"
  | "went_offline"
  | "updated"
  | "changed_alias";

export type TimeRange = "24h" | "week" | "month" | "custom";

export interface TimeFilter {
  range: TimeRange;
  startDate?: Date;
  endDate?: Date;
}
