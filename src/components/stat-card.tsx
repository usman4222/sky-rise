import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon, label, value, trend, accent = "primary",
}: {
  icon: LucideIcon; label: string; value: string; trend?: string;
  accent?: "primary" | "gold" | "profit";
}) {
  const accents: Record<string, string> = {
    primary: "bg-gradient-to-br from-violet-400 to-blue-400 text-white",
    gold: "bg-gradient-to-br from-amber-300 to-orange-400 text-white",
    profit: "bg-gradient-to-br from-emerald-400 to-cyan-400 text-white",
  };
  return (
    <Card className="glass-card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {trend && <p className="mt-2 text-xs font-medium text-emerald-500">{trend}</p>}
          </div>
          <div className={`grid h-12 w-12 place-items-center rounded-full shadow-soft ${accents[accent]}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
