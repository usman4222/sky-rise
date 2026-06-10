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
  // Image-matched accent system:
  // green: solid emerald (#00a86b) — matches stock chart bar color & wallet coins
  // gold: solid warm gold (#f3ba2f) — matches the charging bull, keys, zipper
  // profit: deep forest (#00693e) with gold icon — matches image deep green + gold key combo
  // primary: light neon-green tint — circuit trace ambient feel
  // yellow: light gold tint
  // active: deep forest green
  const accents: Record<string, { bg: string; text: string; shadow: string }> = {
    primary: {
      bg: "bg-[#00a86b]/10 text-[#00a86b]",
      text: "text-[#00a86b]",
      shadow: "shadow-none"
    },
    green: {
      bg: "bg-[#00a86b] text-white",
      text: "text-[#00a86b]",
      shadow: "shadow-[0_8px_18px_rgba(0,168,107,0.30)]"
    },
    profit: {
      bg: "bg-[#00693e] text-[#f3ba2f]",
      text: "text-[#00693e]",
      shadow: "shadow-[0_8px_18px_rgba(0,105,62,0.24)]"
    },
    gold: {
      bg: "bg-[#f3ba2f] text-white",
      text: "text-[#f3ba2f]",
      shadow: "shadow-[0_8px_18px_rgba(243,186,47,0.30)]"
    },
    yellow: {
      bg: "bg-[#f3ba2f]/12 text-[#d4a017]",
      text: "text-[#d4a017]",
      shadow: "shadow-none"
    },
    active: {
      bg: "bg-[#00693e] text-white",
      text: "text-[#00693e]",
      shadow: "shadow-[0_8px_18px_rgba(0,105,62,0.28)]"
    }
  };

  // Override specific accents for global metrics to keep solid badges:
  let finalAccent = accent;
  if (accent === "profit" || accent === "primary") {
    const l = label.toLowerCase();
    if (l.includes("user") || l.includes("deposit") || l.includes("earn") || l.includes("roi") || l.includes("balance") || l.includes("package")) {
      finalAccent = "green";
    } else if (l.includes("withdraw") || l.includes("salary") || l.includes("pending")) {
      finalAccent = "gold";
    }
  }

  const selectedAccent = accents[finalAccent] || accents.primary;

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
    <div className="h-full w-full bg-[#f8fdf9]/98 dark:bg-[#081407]/95 border border-[#c2ddd2] dark:border-[#00e676]/10 rounded-[28px] shadow-[0_12px_24px_rgba(0,105,62,0.04)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,105,62,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(0,230,118,0.06)] hover:-translate-y-0.5 flex flex-col justify-between glass-card-hover">
      <div className="p-4 sm:p-5 flex items-center justify-between gap-4 h-full">
        {/* Left Side: Text Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[10px] sm:text-xs font-extrabold text-[#3d6652] dark:text-[#00e676]/70 uppercase tracking-widest leading-tight">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-black tracking-tight text-[#051409] dark:text-[#e2f0ea] break-all leading-none mt-2 font-sans">
            {value}
          </p>
          {displaySubtitle ? (
            <p className="text-[10px] sm:text-xs font-semibold text-[#3d6652]/70 dark:text-[#7aab90] mt-2 leading-none flex items-center gap-1">
              {displaySubtitle}
            </p>
          ) : (
            // Spacer to keep layout alignment matching cards with subtitles
            <div className="h-3 sm:h-3.5 mt-2" />
          )}
          {trend && (
            <p className="mt-1.5 text-xs font-bold text-[#00a86b] dark:text-[#00e676]">
              {trend}
            </p>
          )}
        </div>

        {/* Right Side: Circular Icon container */}
        <div className={`h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full flex-shrink-0 transition-transform duration-300 hover:scale-105 ${selectedAccent.bg} ${selectedAccent.shadow}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
