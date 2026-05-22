import { Moon, Sun, Server, Globe } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 shadow-sm backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea3b92] via-[#c026d3] to-[#7c3aed] shadow-lg shadow-[#ea3b92]/30 transition-transform duration-300 hover:scale-110">
            <Server className="h-5 w-5 text-white" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Server<span className="text-[#ea3b92]">Monitor</span>
            </h1>
            <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">Real-time Infrastructure Dashboard</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Globe icon accent */}
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/80 px-3 py-1.5 md:flex">
            <Globe className="h-3.5 w-3.5 text-[#ea3b92]" />
            <span className="text-xs font-medium text-muted-foreground">80 Servers</span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </span>
            <span className="text-xs font-semibold text-success">Live</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-secondary text-muted-foreground transition-all duration-300 hover:border-[#ea3b92]/40 hover:bg-[#ea3b92]/10 hover:text-[#ea3b92] hover:shadow-lg hover:shadow-[#ea3b92]/10"
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
