import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { TrendingUp } from "lucide-react";

interface TimelineChartProps {
  data: { date: string; total: number; newServers: number }[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Show max ~15 data points for readability
  const displayData =
    data.length > 15
      ? data.filter((_, i) => i % Math.ceil(data.length / 15) === 0 || i === data.length - 1)
      : data;

  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ea3b92]/10">
            <TrendingUp className="h-4 w-4 text-[#ea3b92]" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Server Timeline</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-[#ea3b92]" />
            <span className="text-[10px] font-semibold text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-[#10b981]" />
            <span className="text-[10px] font-semibold text-muted-foreground">New</span>
          </div>
        </div>
      </div>
      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea3b92" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ea3b92" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.15)"}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: isDark ? "#7f8ea3" : "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? "#7f8ea3" : "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? "#0d1117" : "#ffffff",
                border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
                color: isDark ? "#e2e8f0" : "#0f172a",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                padding: "10px 14px",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#ea3b92"
              strokeWidth={2.5}
              fill="url(#gradientTotal)"
              dot={false}
              activeDot={{ r: 5, stroke: "#ea3b92", strokeWidth: 2, fill: isDark ? "#0d1117" : "#ffffff" }}
            />
            <Area
              type="monotone"
              dataKey="newServers"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradientNew)"
              dot={false}
              activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: isDark ? "#0d1117" : "#ffffff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
