import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Zap, Plus, Minus, RotateCcw, Users, Search, X } from "lucide-react";
import type { Server } from "@/types/server";
import { useTheme } from "@/context/ThemeContext";
import { groupServersByLocation } from "@/utils/statsUtils";
import fallbackCountriesGeoJsonRaw from "@/data/ne_110m_admin_0_countries.geojson?raw";

interface ServerMap2DProps {
  servers: Server[];
}

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  US: "🇺🇸",
  DE: "🇩🇪",
  GB: "🇬🇧",
  JP: "🇯🇵",
  SG: "🇸🇬",
  AU: "🇦🇺",
  BR: "🇧🇷",
  IN: "🇮🇳",
  CA: "🇨🇦",
  FR: "🇫🇷", 
  VN: "🇻🇳",
  KR: "🇰🇷",
  NL: "🇳🇱",
  SE: "🇸🇪",
  IE: "🇮🇪",
  ZA: "🇿🇦",
};

const fallbackGeoJsonData = JSON.parse(fallbackCountriesGeoJsonRaw);

type Region = "Europe" | "Asia" | "Africa" | "America" | "Oceania";

function getRegion(countryCode: string): Region {
  const regionMap: Record<string, Region> = {
    US: "America",
    CA: "America",
    BR: "America",
    DE: "Europe",
    GB: "Europe",
    FR: "Europe",
    NL: "Europe",
    SE: "Europe",
    IE: "Europe",
    JP: "Asia",
    SG: "Asia",
    IN: "Asia",
    KR: "Asia",
    VN: "Asia",
    AU: "Oceania",
    ZA: "Africa",
  };
  return regionMap[countryCode] || "Asia";
}

const regionColors: Record<Region, string> = {
  Europe: "#6366f1",
  Asia: "#f59e0b",
  Africa: "#10b981",
  America: "#ea3b92",
  Oceania: "#3b82f6",
};

// Aspect-ratio-locked Mercator projection with panning and zooming support
function latLngToXY(
  lat: number,
  lng: number,
  width: number,
  height: number,
  zoom: number = 1,
  panOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  // Correct aspect ratio of the Mercator map to prevent stretching
  const mapAspectRatio = 2.05; 
  const paddingX = width * 0.05;
  const paddingY = height * 0.05;
  
  let usableWidth = width - paddingX * 2;
  let usableHeight = usableWidth / mapAspectRatio;
  
  // Fit nicely inside available container box without overflow
  if (usableHeight > height - paddingY * 2) {
    usableHeight = height - paddingY * 2;
    usableWidth = usableHeight * mapAspectRatio;
  }

  // Offsets to perfectly center the projection
  const baseOffsetX = (width - usableWidth) / 2;
  const baseOffsetY = (height - usableHeight) / 2 + height * 0.02;

  // Convert coordinate degrees to canvas scale percentages
  const xPercent = (lng + 180) / 360;
  const projectedX = xPercent * usableWidth + baseOffsetX;
  
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const maxMerc = 2.6; // Limit poles stretching
  const yPercent = (mercN + maxMerc) / (maxMerc * 2);
  const projectedY = (1 - yPercent) * usableHeight + baseOffsetY;

  // Zoom centered at mid-point of canvas + pan drag translations
  const centerX = width / 2;
  const centerY = height / 2;
  
  const x = (projectedX - centerX) * zoom + centerX + panOffset.x;
  const y = (projectedY - centerY) * zoom + centerY + panOffset.y;

  return { x, y };
}

export default function ServerMap2D({ servers }: ServerMap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Interactive zoom & translation states
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [worldDots, setWorldDots] = useState<{ lat: number; lng: number }[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [hoveredServer, setHoveredServer] = useState<{
    x: number;
    y: number;
    servers: Server[];
    country: string;
  } | null>(null);

  const [isDemographicsModalOpen, setIsDemographicsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { theme } = useTheme();
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Sync ref to read values in mouse move callbacks
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // Group servers by country
  const countryData = useMemo(() => {
    const grouped: Record<string, { count: number; online: number; countryCode: string; country: string }> = {};
    servers.forEach((s) => {
      if (!grouped[s.countryCode]) {
        grouped[s.countryCode] = { count: 0, online: 0, countryCode: s.countryCode, country: s.country };
      }
      grouped[s.countryCode].count++;
      if (s.status === "online") grouped[s.countryCode].online++;
    });
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [servers]);

  // Group servers by proximity location using the unified clustering algorithm
  const locationGroups = useMemo(() => {
    return groupServersByLocation(servers).map((g) => ({
      ...g,
      countryCode: g.servers[0]?.countryCode || "US",
    }));
  }, [servers]);

  const maxCount = useMemo(() => Math.max(...countryData.map((c) => c.count)), [countryData]);

  // Load geo json boundaries
  useEffect(() => {
    fetch("https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load map data");
        return res.json();
      })
      .then((data) => {
        setGeoJsonData(data);
        setIsLoadingGeo(false);
      })
      .catch((err) => {
        console.warn("Could not fetch world map GeoJSON, using local fallback:", err);
        setGeoJsonData(fallbackGeoJsonData);
        setIsLoadingGeo(false);
      });
  }, []);

  // Window resize listeners
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(rect.width * 0.48, 380) });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Add Wheel scroll listening
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z * zoomFactor, 5.0));
      } else {
        setZoom((z) => Math.max(z / zoomFactor, 0.7));
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // Pixel sampling on mounting
  useEffect(() => {
    if (dimensions.width === 0) return;

    const sampleWidth = 1024;
    const sampleHeight = 512;
    const offscreen = document.createElement("canvas");
    offscreen.width = sampleWidth;
    offscreen.height = sampleHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, sampleWidth, sampleHeight);

    ctx.fillStyle = "#ffffff";
    
    if (geoJsonData && geoJsonData.features) {
      geoJsonData.features.forEach((feature: any) => {
        const geom = feature.geometry;
        if (!geom) return;

        const drawPolygon = (polygonCoords: number[][]) => {
          ctx.beginPath();
          polygonCoords.forEach(([lng, lat], index) => {
            const x = ((lng + 180) / 360) * sampleWidth;
            const latRad = (lat * Math.PI) / 180;
            const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            const maxMerc = 3.1;
            const yPercent = (mercN + maxMerc) / (maxMerc * 2);
            const y = (1 - yPercent) * sampleHeight;

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fill();
        };

        if (geom.type === "Polygon") {
          geom.coordinates.forEach(drawPolygon);
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((poly: any) => poly.forEach(drawPolygon));
        }
      });

      const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const dots: { lat: number; lng: number }[] = [];
      
      const stepX = 7;
      const stepY = 7;

      for (let y = 15; y < sampleHeight - 15; y += stepY) {
        for (let x = 10; x < sampleWidth - 10; x += stepX) {
          const pixelIndex = (y * sampleWidth + x) * 4;
          const r = imgData.data[pixelIndex];
          if (r > 200) {
            const lng = (x / sampleWidth) * 360 - 180;
            const yPercent = 1 - (y / sampleHeight);
            const maxMerc = 3.1;
            const mercN = yPercent * (maxMerc * 2) - maxMerc;
            const latRad = 2 * (Math.atan(Math.exp(mercN)) - Math.PI / 4);
            const lat = (latRad * 180) / Math.PI;

            if (lat > -60 && lat < 78) {
              dots.push({ lat, lng });
            }
          }
        }
      }
      setWorldDots(dots);
    } else {
      setWorldDots([]);
    }
  }, [geoJsonData, dimensions.width]);

  // Anim looping
  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || dimensions.width === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      ctx.scale(dpr, dpr);

      const isDark = theme === "dark";
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Dot elements
      const dotSize = Math.max(1.1, 1.6 * zoom);
      const dotColor = isDark ? "rgba(100, 116, 139, 0.28)" : "rgba(148, 163, 184, 0.38)";

      worldDots.forEach((dot) => {
        const { x, y } = latLngToXY(dot.lat, dot.lng, dimensions.width, dimensions.height, zoom, panOffset);
        if (x < 0 || x > dimensions.width || y < 0 || y > dimensions.height) return;

        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      });

      // Markers
      locationGroups.forEach((group) => {
        const { x, y } = latLngToXY(group.lat, group.lng, dimensions.width, dimensions.height, zoom, panOffset);
        if (x < 0 || x > dimensions.width || y < 0 || y > dimensions.height) return;

        const region = getRegion(group.countryCode);
        const baseColor = regionColors[region];

        const hasOffline = group.servers.some((s) => s.status === "offline");
        const allOffline = group.servers.every((s) => s.status === "offline");

        const statusColor = allOffline ? "#ef4444" : hasOffline ? "#f59e0b" : "#ffffff";

        const pulsePhase = (time / 1400 + group.lat * 0.02) % 1;
        const pulseRadius = 5 + pulsePhase * 16 * zoom;
        const pulseAlpha = (1 - pulsePhase) * 0.35;

        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = baseColor;
        ctx.globalAlpha = pulseAlpha;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 9 * zoom);
        glow.addColorStop(0, baseColor + "55");
        glow.addColorStop(1, baseColor + "00");
        ctx.beginPath();
        ctx.arc(x, y, 9 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 4.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2.0 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (group.servers.length > 1) {
          ctx.font = `bold ${Math.max(9, 10.5 * zoom)}px Inter, sans-serif`;
          ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
          ctx.shadowColor = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
          ctx.shadowBlur = 4;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`${group.servers.length}`, x, y - 8 * zoom);
          ctx.shadowBlur = 0; 
        }
      });

      timeRef.current = time;
      animFrameRef.current = requestAnimationFrame(draw);
    },
    [dimensions, theme, worldDots, locationGroups, zoom, panOffset]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Panning & dragging event handlers
  const findClosestLocationGroup = useCallback(
    (x: number, y: number) => {
      let closestGroup: any = null;
      let minDistance = Math.max(22, 26 * zoom);

      for (const group of locationGroups) {
        const projected = latLngToXY(group.lat, group.lng, dimensions.width, dimensions.height, zoom, panOffsetRef.current);
        const dist = Math.sqrt((x - projected.x) ** 2 + (y - projected.y) ** 2);
        if (dist < minDistance) {
          minDistance = dist;
          closestGroup = group;
        }
      }

      return closestGroup;
    },
    [dimensions, locationGroups, zoom]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current) {
        e.preventDefault();
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        setPanOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setHoveredServer(null); // Hide tooltip during active translation dragging
        return;
      }

      if (e.pointerType === "touch") return;

      // Magnetic Hover Snapping: Snaps to the single closest server node cluster within a generous threshold
      const closestGroup = findClosestLocationGroup(mouseX, mouseY);

      if (closestGroup) {
        setHoveredServer({ x: mouseX, y: mouseY, servers: closestGroup.servers, country: closestGroup.country });
      } else {
        setHoveredServer(null);
      }
    },
    [findClosestLocationGroup]
  );

  const handlePointerUpOrCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const movedDistance = Math.sqrt(
      (e.clientX - pointerDownRef.current.x) ** 2 + (e.clientY - pointerDownRef.current.y) ** 2
    );

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
    setIsDragging(false);

    if (canvas) {
      canvas.style.cursor = "grab";

      if (movedDistance < 6) {
        const rect = canvas.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        const closestGroup = findClosestLocationGroup(pointerX, pointerY);

        if (closestGroup) {
          setHoveredServer({ x: pointerX, y: pointerY, servers: closestGroup.servers, country: closestGroup.country });
        } else {
          setHoveredServer(null);
        }
      }
    }
  }, [findClosestLocationGroup]);

  // Restore defaults
  const handleReset = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    setHoveredServer(null);
  }, []);

  const topCountries = countryData.slice(0, 6);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold tracking-tight">Target Demographics</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-info/15 px-2.5 py-0.5 text-[10px] font-bold text-info">
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
            Live Coordinates
          </span>
          {isLoadingGeo && (
            <span className="text-[10px] text-muted-foreground animate-pulse">
              Syncing geographic boundaries...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden items-center gap-4 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 md:flex">
            {(["Europe", "Asia", "Africa", "America", "Oceania"] as Region[]).map((region) => (
              <div key={region} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: regionColors[region], boxShadow: `0 0 6px ${regionColors[region]}40` }}
                />
                <span className="text-[11px] font-medium text-muted-foreground">{region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Canvas Projection Container */}
        <div ref={containerRef} className="relative flex-1 min-h-[380px] select-none bg-background/5">
          {/* Mode label indicator */}
          <div className="absolute left-4 top-4 z-10 flex h-8 items-center gap-2 rounded-lg border border-border/50 bg-card/90 px-2.5 shadow-md backdrop-blur-sm">
            <Zap className="h-4 w-4 text-warning animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drag to Pan / Scroll to Zoom</span>
          </div>

          <canvas
            ref={canvasRef}
            className="h-full w-full active:cursor-grabbing"
            style={{ 
              width: dimensions.width || "100%", 
              height: dimensions.height || 380,
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
          />

          {/* Interactive contextual tooltip */}
          {hoveredServer && (
            <div
              className="pointer-events-none absolute z-30 rounded-xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200"
              style={{
                left: Math.min(hoveredServer.x + 12, dimensions.width - 260),
                top: hoveredServer.y - 10,
              }}
            >
              <p className="mb-1.5 text-xs font-extrabold gradient-text">{hoveredServer.country}</p>
              <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
                {hoveredServer.servers.length} Active Node{hoveredServer.servers.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-1">
                {hoveredServer.servers.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 py-0.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: s.status === "online" ? "#10b981" : "#ef4444",
                        boxShadow: `0 0 5px ${s.status === "online" ? "#10b981" : "#ef4444"}60`,
                      }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{s.ip}</span>
                    <span className="text-[10px] font-bold">{s.hostname}</span>
                  </div>
                ))}
              </div>
              {hoveredServer.servers.length > 4 && (
                <p className="mt-2 border-t border-border/30 pt-1 text-[9px] font-medium text-muted-foreground">
                  +{hoveredServer.servers.length - 4} other nodes
                </p>
              )}
            </div>
          )}

          {/* Controls toolbar (Reset, Plus, Minus) */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            <button
              onClick={handleReset}
              title="Reset view layout"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/90 text-muted-foreground shadow-md backdrop-blur-sm transition-all hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 5.0))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/90 text-muted-foreground shadow-md backdrop-blur-sm transition-all hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/90 text-muted-foreground shadow-md backdrop-blur-sm transition-all hover:bg-secondary hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Demographics Panel */}
        <div className="w-full border-t border-border/50 p-5 lg:w-[320px] lg:border-l lg:border-t-0">
          <div className="mb-5">
            <div className="flex items-start justify-between">
              <p className="text-4xl font-extrabold tracking-tight">
                {servers.length.toLocaleString()}
              </p>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">Global servers worldwide</p>
          </div>

          <div className="space-y-4">
            {topCountries.map((c) => {
              const percentage = Math.round((c.count / maxCount) * 100);
              const region = getRegion(c.countryCode);
              const color = regionColors[region];

              return (
                <div key={c.countryCode} className="group">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{countryFlags[c.countryCode] || "🏳️"}</span>
                      <span className="text-sm font-semibold">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color }}>
                        {c.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({c.online} online)
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-85"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        boxShadow: `0 0 6px ${color}20`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {countryData.length > 6 && (
            <button 
              onClick={() => setIsDemographicsModalOpen(true)}
              className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all cursor-pointer"
            >
              See All Demographics
              <span className="text-[10px]">Open</span>
            </button>
          )}
        </div>
      </div>

      {/* Demographics Modal overlay */}
      {isDemographicsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md animate-fade-in"
          onClick={() => {
            setIsDemographicsModalOpen(false);
            setSearchQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsDemographicsModalOpen(false);
              setSearchQuery("");
            }
          }}
        >
          {/* Modal Content — stop propagation so clicking inside doesn't close */}
          <div 
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsDemographicsModalOpen(false);
                setSearchQuery("");
              }}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-bold tracking-tight mb-1">Global Target Demographics</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Distribution of servers across {countryData.length} countries
            </p>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Scrollable list */}
            <div className="max-h-[350px] overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
              {countryData
                .filter((c) => c.country.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((c) => {
                  const percentage = Math.round((c.count / maxCount) * 100);
                  const region = getRegion(c.countryCode);
                  const color = regionColors[region];

                  return (
                    <div key={c.countryCode} className="group">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{countryFlags[c.countryCode] || "🏳️"}</span>
                          <span className="text-sm font-semibold">{c.country}</span>
                          <span 
                            className="rounded-full px-2 py-0.5 text-[9px] font-bold border"
                            style={{ 
                              borderColor: `${color}30`, 
                              color, 
                              backgroundColor: `${color}10` 
                            }}
                          >
                            {region}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color }}>
                            {c.count} node{c.count > 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({c.online} online)
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-85"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                            boxShadow: `0 0 6px ${color}20`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              
              {countryData.filter((c) => c.country.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No demographics found matching "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
