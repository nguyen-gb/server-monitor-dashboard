import { Clock, Calendar, ChevronRight } from "lucide-react";
import type { TimeFilter as TimeFilterType, TimeRange } from "@/types/server";
import { cn } from "@/lib/utils";

interface TimeFilterProps {
  filter: TimeFilterType;
  onChange: (filter: TimeFilterType) => void;
}

const rangeOptions: { value: TimeRange; label: string; icon?: string }[] = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function TimeFilter({ filter, onChange }: TimeFilterProps) {
  const handleRangeChange = (range: TimeRange) => {
    if (range === "custom") {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      onChange({ range, startDate: weekAgo, endDate: now });
    } else {
      onChange({ range });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]/10">
            <Clock className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <span className="text-sm font-bold text-foreground hidden sm:inline">Filter</span>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />

        {/* Range buttons */}
        <div className="flex flex-wrap gap-1.5">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleRangeChange(option.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300",
                filter.range === option.value
                  ? "bg-[#ea3b92] text-white shadow-lg shadow-[#ea3b92]/30 scale-[1.02]"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {filter.range === "custom" && (
          <div className="flex flex-wrap items-center gap-2 ml-auto animate-fade-in">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={filter.startDate ? filter.startDate.toISOString().split("T")[0] : ""}
              onChange={(e) => onChange({ ...filter, startDate: new Date(e.target.value) })}
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-all focus:border-[#ea3b92] focus:ring-2 focus:ring-[#ea3b92]/20"
              id="date-start"
            />
            <span className="text-xs text-muted-foreground font-medium">to</span>
            <input
              type="date"
              value={filter.endDate ? filter.endDate.toISOString().split("T")[0] : ""}
              onChange={(e) => onChange({ ...filter, endDate: new Date(e.target.value + "T23:59:59") })}
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-all focus:border-[#ea3b92] focus:ring-2 focus:ring-[#ea3b92]/20"
              id="date-end"
            />
          </div>
        )}
      </div>
    </div>
  );
}
