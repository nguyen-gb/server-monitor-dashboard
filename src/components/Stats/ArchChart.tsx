import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { Cpu } from "lucide-react";

interface ArchChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ["#ea3b92", "#f472b6", "#a855f7", "#7c3aed"];

export default function ArchChart({ data }: ArchChartProps) {
  const { theme } = useTheme();

  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a855f7]/10">
          <Cpu className="h-4 w-4 text-[#a855f7]" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Architectures</h3>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: theme === "dark" ? "#7f8ea3" : "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: theme === "dark" ? "#e2e8f0" : "#334155", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
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
              cursor={{ fill: theme === "dark" ? "rgba(168,85,247,0.04)" : "rgba(168,85,247,0.06)" }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
