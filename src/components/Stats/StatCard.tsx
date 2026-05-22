import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "danger" | "warning" | "primary";
  className?: string;
}

const variantConfig = {
  default: {
    bg: "",
    icon: "bg-secondary text-muted-foreground",
    accent: "#64748b",
  },
  success: {
    bg: "",
    icon: "bg-[#10b981]/15 text-[#10b981]",
    accent: "#10b981",
  },
  danger: {
    bg: "",
    icon: "bg-[#ef4444]/15 text-[#ef4444]",
    accent: "#ef4444",
  },
  warning: {
    bg: "",
    icon: "bg-[#f59e0b]/15 text-[#f59e0b]",
    accent: "#f59e0b",
  },
  primary: {
    bg: "",
    icon: "bg-[#ea3b92]/15 text-[#ea3b92]",
    accent: "#ea3b92",
  },
};

export default function StatCard({ title, value, icon, trend, variant = "default", className }: StatCardProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      {/* Decorative corner accent */}
      <div
        className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-[0.08] blur-2xl transition-all duration-500 group-hover:opacity-[0.18]"
        style={{ background: config.accent }}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-4xl font-extrabold tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: `${config.accent}18`,
                  color: config.accent,
                }}
              >
                {trend.value >= 0 ? "+" : "-"}{Math.abs(trend.value)}
              </span>
              <span className="text-[10px] text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
            config.icon
          )}
        >
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[3px] w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${config.accent}, transparent)` }}
      />
    </div>
  );
}
