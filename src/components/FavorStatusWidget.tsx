import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, Timer, Award, UserCheck, Calendar } from "lucide-react";

interface FavorStatusWidgetProps {
  user: any;
}

export function FavorStatusWidget({ user }: FavorStatusWidgetProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!user || !user.favorCycleEndDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(user.favorCycleEndDate).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft("Cycle Expired");
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
      setIsUrgent(days < 3); // Mark urgent if less than 3 days remaining
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user || !user.favorConditionEnabled) return null;

  const isBlocked = user.favorWithdrawalStatus === "blocked";
  const progressPercent = user.favorProgressPercent || 0;
  const favorAmount = user.favorAmount || 0;
  const requiredBusiness = user.favorRequiredBusiness || 0;
  const achievedBusiness = user.favorAchievedBusiness || 0;
  const remainingBusiness = user.favorRemainingBusiness || 0;

  return (
    <Card className="border-glass-border shadow-2xl relative overflow-hidden bg-glass-surface backdrop-blur-md rounded-3xl">
      {/* Decorative Glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
        isBlocked ? "bg-destructive/10" : isUrgent ? "bg-amber-500/10" : "bg-emerald-500/10"
      }`} />

      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Leader Business Requirement
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Your Favor Account has an active monthly 1X business generation condition.
            </CardDescription>
          </div>
          <Badge className={`w-fit text-[10px] font-bold rounded-full py-1 px-3 ${
            isBlocked
              ? "bg-destructive/15 text-destructive border border-destructive/20 animate-pulse"
              : isUrgent
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
          }`}>
            {isBlocked ? "Withdrawals Suspended" : isUrgent ? "Action Needed" : "Requirement Active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Banner when Blocked */}
        {isBlocked && (
          <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-2xl flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold block">Withdrawals Suspended</span>
              <span className="block opacity-90">
                You have not completed your monthly 1X business target of ${requiredBusiness.toFixed(2)}. Payout withdrawals will remain suspended until the target is met.
              </span>
            </div>
          </div>
        )}

        {/* Progress Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-neutral-900/40 border border-glass-border/20">
            <span className="text-[10px] text-muted-foreground uppercase block font-bold">Favor Balance</span>
            <span className="text-lg font-black text-foreground mt-0.5 block">${favorAmount.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/40 border border-glass-border/20">
            <span className="text-[10px] text-muted-foreground uppercase block font-bold">Target Target</span>
            <span className="text-lg font-black text-primary mt-0.5 block">${requiredBusiness.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/40 border border-glass-border/20">
            <span className="text-[10px] text-muted-foreground uppercase block font-bold">Achieved Volume</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">${achievedBusiness.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/40 border border-glass-border/20">
            <span className="text-[10px] text-muted-foreground uppercase block font-bold">Remaining Target</span>
            <span className="text-lg font-black text-destructive mt-0.5 block">${remainingBusiness.toFixed(2)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Cycle Progress ({achievedBusiness.toFixed(0)} / {requiredBusiness.toFixed(0)})</span>
            <span className="text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Cycle Expiry countdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-glass-border/30 text-xs">
          <div className="flex items-center gap-2">
            <Timer className={`h-4 w-4 ${isUrgent ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
            <div>
              <span className="text-muted-foreground block">Time Remaining in Cycle</span>
              <span className={`font-black tracking-tight ${
                isBlocked || isUrgent ? "text-destructive" : "text-foreground"
              }`}>
                {timeLeft}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground block">Next Cycle Deadline</span>
              <span className="font-semibold text-foreground">
                {new Date(user.favorCycleEndDate).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
