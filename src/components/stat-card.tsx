import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  subtitle,
  accent = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  subtitle?: string;
  accent?: "primary" | "gold" | "profit" | "green" | "yellow" | "active";
}) {
  // Map accents to match the exact Nequlix image colors:
  // - green/profit: deep emerald with light white/green icon
  // - gold/yellow: vibrant gold with dark gold icon
  const accents: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-[#0e9f6e]/10 text-[#0e9f6e]", text: "text-[#0e9f6e]" },
    green: { bg: "bg-[#0e9f6e] text-white", text: "text-[#0e9f6e]" },
    profit: { bg: "bg-[#004d33] text-[#f3ba2f]", text: "text-[#004d33]" },
    gold: { bg: "bg-[#f3ba2f] text-white", text: "text-[#f3ba2f]" },
    yellow: { bg: "bg-[#f3ba2f]/10 text-[#f3ba2f]", text: "text-[#f3ba2f]" },
    active: { bg: "bg-primary text-white", text: "text-primary" }
  };

  const selectedAccent = accents[accent] || accents.primary;

  // Auto-generate PKR equivalent if the value is USD
  let displaySubtitle = subtitle;
  if (!displaySubtitle && typeof value === "string" && value.startsWith("$")) {
    const numericVal = parseFloat(value.replace("$", "").replace(/,/g, ""));
    if (!isNaN(numericVal)) {
      displaySubtitle = `≈ PKR ${(numericVal * 278.42).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
  }

  return (
    <Card className="glass-card-hover overflow-hidden bg-white/80 dark:bg-card/80 border-glass-border">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
        {/* Left Side: Text Details */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none truncate">
            {label}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-foreground break-all leading-tight mt-1.5">
            {value}
          </p>
          {displaySubtitle && (
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1">
              {displaySubtitle}
            </p>
          )}
          {trend && (
            <p className="mt-1 text-[10px] sm:text-xs font-semibold text-emerald-500">
              {trend}
            </p>
          )}
        </div>

        {/* Right Side: Circular Icon container */}
        <div className={`h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full shadow-md flex-shrink-0 transition-transform hover:scale-110 ${selectedAccent.bg}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
