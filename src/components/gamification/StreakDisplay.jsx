import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Flame, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function StreakDisplay({ clientEmail }) {
  const { data: userLevel, isLoading } = useQuery({
    queryKey: ["user-streak", clientEmail],
    queryFn: () => base44.entities.UserLevel.filter({ client_email: clientEmail }),
    select: (data) => data[0],
    refetchInterval: 60000,
  });

  if (isLoading || !userLevel) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  const currentStreak = userLevel.current_streak || 0;
  const longestStreak = userLevel.longest_streak || 0;
  const onFire = currentStreak >= 3;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Streak */}
      <div className={`rounded-2xl p-5 border-2 ${onFire ? "bg-orange-50 border-orange-200" : "bg-card border-border"}`}>
        <div className="flex items-center gap-2 mb-2">
          {onFire ? <Flame className="w-5 h-5 text-orange-600" /> : <Zap className="w-5 h-5 text-muted-foreground" />}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Streak</span>
        </div>
        <div className="text-3xl font-black text-foreground">{currentStreak}</div>
        <div className="text-xs text-muted-foreground mt-1">Consecutive days</div>
        {onFire && <div className="text-[10px] font-bold text-orange-600 mt-2">🔥 You're on fire!</div>}
      </div>

      {/* Longest Streak */}
      <div className="rounded-2xl p-5 border-2 border-border bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Best Streak</span>
        </div>
        <div className="text-3xl font-black text-foreground">{longestStreak}</div>
        <div className="text-xs text-muted-foreground mt-1">Days</div>
      </div>
    </div>
  );
}

import { Trophy } from "lucide-react";