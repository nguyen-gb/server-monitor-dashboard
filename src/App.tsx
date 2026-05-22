import { useState, useMemo } from "react";
import { Server, Wifi, WifiOff, PlusCircle, Globe, Map } from "lucide-react";

import Header from "@/components/Layout/Header";
import StatCard from "@/components/Stats/StatCard";
import ServerGlobe from "@/components/Globe/ServerGlobe";
import ServerMap2D from "@/components/Globe/ServerMap2D";
import OsChart from "@/components/Stats/OsChart";
import PlatformChart from "@/components/Stats/PlatformChart";
import ArchChart from "@/components/Stats/ArchChart";
import TimelineChart from "@/components/Stats/TimelineChart";
import TimeFilterComponent from "@/components/TimeFilter/TimeFilter";
import ActivityFeed from "@/components/Activity/ActivityFeed";

import { servers } from "@/data/servers";
import { activities } from "@/data/activities";
import { countByField, getTopItems, countNewServers, getServerTimeline, filterServersByTime } from "@/utils/statsUtils";
import type { TimeFilter } from "@/types/server";

export default function App() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ range: "month" });
  const [mapView, setMapView] = useState<"3d" | "2d">("2d");

  const totalServers = servers.length;
  const onlineServers = servers.filter((s) => s.status === "online").length;
  const offlineServers = servers.filter((s) => s.status === "offline").length;
  const filteredServers = useMemo(() => filterServersByTime(servers, timeFilter), [timeFilter]);
  const newServers = useMemo(() => countNewServers(servers, timeFilter), [timeFilter]);

  const osData = useMemo(() => getTopItems(countByField(servers, "os"), 6), []);
  const platformData = useMemo(() => getTopItems(countByField(servers, "platform"), 6), []);
  const archData = useMemo(() => getTopItems(countByField(servers, "arch"), 4), []);
  const timelineData = useMemo(() => getServerTimeline(servers, timeFilter), [timeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-8 sm:px-8 lg:px-12 xl:px-16">
        {/* KPI Cards */}
        <section className="dashboard-section mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6" id="stats-overview">
          <StatCard
            title="Total Servers"
            value={totalServers}
            icon={<Server className="h-5 w-5" />}
            variant="primary"
            trend={{ value: filteredServers.length, label: "created in period" }}
          />
          <StatCard
            title="Online"
            value={onlineServers}
            icon={<Wifi className="h-5 w-5" />}
            variant="success"
            trend={{ value: onlineServers, label: "active" }}
          />
          <StatCard
            title="Offline"
            value={offlineServers}
            icon={<WifiOff className="h-5 w-5" />}
            variant="danger"
          />
          <StatCard
            title="New Servers"
            value={newServers}
            icon={<PlusCircle className="h-5 w-5" />}
            variant="warning"
            trend={{ value: newServers, label: "in period" }}
          />
        </section>

        {/* Map View Toggle + Globe/Map */}
        <section className="dashboard-section mb-8" id="server-globe">
          {/* View toggle */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Server Locations
            </h2>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1 backdrop-blur-sm">
              <button
                onClick={() => setMapView("2d")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  mapView === "2d"
                    ? "bg-gradient-to-r from-[#ea3b92] to-[#7c3aed] text-white shadow-lg shadow-[#ea3b92]/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                id="toggle-2d"
              >
                <Map className="h-3.5 w-3.5" />
                2D Map
              </button>
              <button
                onClick={() => setMapView("3d")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  mapView === "3d"
                    ? "bg-gradient-to-r from-[#ea3b92] to-[#7c3aed] text-white shadow-lg shadow-[#ea3b92]/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                id="toggle-3d"
              >
                <Globe className="h-3.5 w-3.5" />
                3D Globe
              </button>
            </div>
          </div>

          {/* Map content */}
          <div className="relative">
            {mapView === "3d" ? (
              <ServerGlobe servers={servers} />
            ) : (
              <ServerMap2D servers={servers} />
            )}
          </div>
        </section>

        {/* Charts Row */}
        <section className="dashboard-section mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6" id="stats-charts">
          <OsChart data={osData} />
          <PlatformChart data={platformData} />
          <ArchChart data={archData} />
        </section>

        {/* Time Filter */}
        <section className="dashboard-section mb-8" id="time-filter">
          <TimeFilterComponent filter={timeFilter} onChange={setTimeFilter} />
        </section>

        {/* Timeline + Activity */}
        <section className="dashboard-section mb-8 grid gap-5 lg:grid-cols-5 lg:gap-6" id="timeline-activity">
          <div className="lg:col-span-3">
            <TimelineChart data={timelineData} />
          </div>
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities} />
          </div>
        </section>

        {/* Footer */}
        <footer className="dashboard-section border-t border-border/30 py-8 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            <span className="gradient-text font-bold">ServerMonitor</span>
            {" "}Dashboard &copy; {new Date().getFullYear()}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Built with React / Tailwind CSS / react-globe.gl / Recharts
          </p>
        </footer>
      </main>
    </div>
  );
}
