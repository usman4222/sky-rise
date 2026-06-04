import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon, label, value, trend, accent = "primary",
}: {
  icon: LucideIcon; label: string; value: string | number; trend?: string;
  accent?: "primary" | "gold" | "profit";
}) {
  const accents: Record<string, string> = {
    primary: "bg-gradient-to-br from-violet-400 to-blue-400 text-white",
    gold: "bg-gradient-to-br from-amber-300 to-orange-400 text-white",
    profit: "bg-gradient-to-br from-emerald-400 to-cyan-400 text-white",
  };
  return (
    <Card className="glass-card-hover overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
            {label}
          </p>
          <div className={`grid h-9 w-9 place-items-center rounded-full shadow-soft flex-shrink-0 ${accents[accent]}`}>
            <Icon size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold tracking-tight text-foreground break-all leading-none">
            {value}
          </p>
          {trend && <p className="mt-1.5 text-xs font-semibold text-emerald-500 leading-none">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
