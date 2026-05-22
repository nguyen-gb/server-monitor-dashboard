import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { Monitor } from "lucide-react";

interface OsChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ["#ea3b92", "#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function OsChart({ data }: OsChartProps) {
  const { theme } = useTheme();
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ea3b92]/10">
          <Monitor className="h-4 w-4 text-[#ea3b92]" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Operating Systems</h3>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-[170px] w-[170px] flex-shrink-0">
          {/* Center label - behind chart tooltip */}
          <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold">{total}</span>
            <span className="text-[10px] font-medium text-muted-foreground">Total</span>
          </div>
          {/* Chart - tooltip renders above center label */}
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: theme === "dark" ? "#0d1117" : "#ffffff",
                    border: `1px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    padding: "8px 14px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden">
          {data.map((item, index) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">{item.name}</span>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <div className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-secondary sm:block">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-bold">{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
