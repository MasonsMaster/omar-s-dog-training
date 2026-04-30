import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Flame, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Leaderboard() {
  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.asServiceRole.entities.UserLevel.list("-total_xp", 100),
    refetchInterval: 60000, // Refresh every minute
  });

  const topTrainers = levels.slice(0, 10);
  const streakLeaders = [...levels].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0)).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-lg">Top Trainers</h3>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">By Total XP</span>
        </div>

        <div className="space-y-2">
          {topTrainers.map((trainer, idx) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[idx] || `#${idx + 1}`;

            return (
              <div key={trainer.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black w-8 text-center">{medal}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{trainer.client_email.split("@")[0]}</div>
                    <div className="text-xs text-muted-foreground">Level {trainer.current_level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-primary text-lg">{trainer.total_xp.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground font-bold">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-lg">Hot Streaks</h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Consistency Kings</span>
        </div>

        <div className="space-y-2">
          {streakLeaders.map((trainer, idx) => (
            <div key={trainer.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{trainer.client_email.split("@")[0]}</div>
                  <div className="text-xs text-muted-foreground">Best: {trainer.longest_streak || 0} days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-orange-600 text-lg">{trainer.current_streak || 0}</div>
                <div className="text-[10px] text-muted-foreground font-bold">Days</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>Leaderboards update every minute • Based on activity from the past 30 days</span>
      </div>
    </div>
  );
}