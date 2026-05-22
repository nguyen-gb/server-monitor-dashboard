import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Server } from "@/types/server";
import { groupServersByLocation } from "@/utils/statsUtils";
import { useTheme } from "@/context/ThemeContext";

interface ServerGlobeProps {
  servers: Server[];
}

export default function ServerGlobe({ servers }: ServerGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { theme } = useTheme();

  // Dynamic import for react-globe.gl
  useEffect(() => {
    import("react-globe.gl").then((mod) => {
      setGlobeComponent(() => mod.default);
    });
  }, []);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.min(rect.width * 0.65, 520) });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const groupedData = useMemo(() => groupServersByLocation(servers), [servers]);

  const pointsData = useMemo(
    () =>
      groupedData.map((group) => ({
        lat: group.lat,
        lng: group.lng,
        size: Math.min(0.35 + group.count * 0.07, 1.0),
        color: group.servers.some((s) => s.status === "offline")
          ? group.servers.every((s) => s.status === "offline")
            ? "#ef4444"
            : "#f59e0b"
          : "#10b981",
        count: group.count,
        country: group.country,
        servers: group.servers,
      })),
    [groupedData]
  );

  const ringsData = useMemo(
    () =>
      groupedData
        .filter((g) => g.servers.some((s) => s.status === "online"))
        .map((group) => ({
          lat: group.lat,
          lng: group.lng,
          maxR: 2.5,
          propagationSpeed: 1.5,
          repeatPeriod: 2000,
          color: "rgba(234, 59, 146, 0.3)",
        })),
    [groupedData]
  );

  const labelsData = useMemo(
    () =>
      groupedData
        .filter((g) => g.count > 1)
        .map((group) => ({
          lat: group.lat,
          lng: group.lng,
          text: `${group.count}`,
          color: "#ffffff",
          size: Math.min(0.9 + group.count * 0.12, 2.2),
          altitude: Math.min(0.35 + group.count * 0.07, 1.0) * 0.04 + 0.015,
          country: group.country,
        })),
    [groupedData]
  );

  const handlePointHover = useCallback((point: any) => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = !point;
    }
  }, []);

  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
      controls.minDistance = 200;
      controls.maxDistance = 500;
      globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.2 }, 1500);
    }
  }, []);

  if (!GlobeComponent) {
    return (
      <div
        ref={containerRef}
        className="flex h-[450px] w-full items-center justify-center rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#ea3b92]/20 border-t-[#ea3b92]" />
          <p className="text-sm font-medium text-muted-foreground">Initializing Globe...</p>
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className="globe-container relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Gradient overlay top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-card to-transparent" />

      {/* Globe legend */}
      <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
        {[
          { color: "#10b981", label: "All Online" },
          { color: "#f59e0b", label: "Partial" },
          { color: "#ef4444", label: "All Offline" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Server count badge */}
      <div className="absolute right-4 top-4 z-20 rounded-xl border border-[#ea3b92]/20 bg-card/90 px-4 py-2.5 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Servers</p>
        <p className="mt-0.5 text-2xl font-extrabold text-[#ea3b92]">{servers.length}</p>
      </div>

      <GlobeComponent
        ref={globeRef}
        width={dimensions.width || 600}
        height={dimensions.height || 450}
        globeImageUrl={
          isDark
            ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
            : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        }
        backgroundImageUrl={isDark ? "//unpkg.com/three-globe/example/img/night-sky.png" : ""}
        backgroundColor={isDark ? "#06080f" : "#f0f2f5"}
        atmosphereColor={isDark ? "#ea3b92" : "#3b82f6"}
        atmosphereAltitude={0.18}
        pointsData={pointsData}
        pointAltitude={(d: any) => d.size * 0.04}
        pointRadius={(d: any) => Math.max(1.6, d.size * 2.5)}
        pointColor={(d: any) => d.color}
        pointLabel={(d: any) => {
          const serverList = d.servers
            .slice(0, 5)
            .map(
              (s: Server) =>
                `<div style="display:flex;align-items:center;gap:8px;padding:3px 0">
                  <span style="width:6px;height:6px;border-radius:50%;background:${s.status === "online" ? "#10b981" : "#ef4444"};display:inline-block;box-shadow:0 0 4px ${s.status === "online" ? "#10b981" : "#ef4444"}60"></span>
                  <span style="color:#7f8ea3;font-size:11px">${s.ip}</span>
                  <span style="font-weight:600;font-size:11px">${s.hostname}</span>
                </div>`
            )
            .join("");
          const moreText =
            d.servers.length > 5
              ? `<div style="color:#7f8ea3;padding-top:6px;font-size:10px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px">+${d.servers.length - 5} more servers</div>`
              : "";
          return `<div style="background:rgba(6,8,15,0.96);border:1px solid rgba(234,59,146,0.25);border-radius:14px;padding:14px 18px;font-family:Inter,sans-serif;font-size:12px;color:#e2e8f0;min-width:240px;backdrop-filter:blur(12px);box-shadow:0 20px 60px rgba(0,0,0,0.5)">
            <div style="font-weight:800;font-size:14px;margin-bottom:2px;background:linear-gradient(135deg,#ea3b92,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${d.country}</div>
            <div style="font-size:11px;color:#7f8ea3;margin-bottom:8px;font-weight:500">${d.count} server${d.count > 1 ? "s" : ""} at this location</div>
            ${serverList}
            ${moreText}
          </div>`;
        }}
        onPointHover={handlePointHover}
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(234, 59, 146, ${1 - t})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        labelsData={labelsData}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d.text}
        labelSize={(d: any) => d.size}
        labelColor={() => "#ffffff"}
        labelDotRadius={0}
        labelAltitude={(d: any) => d.altitude}
        labelResolution={3}
        onGlobeReady={handleGlobeReady}
        animateIn={true}
      />

      {/* Gradient overlay bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
}
