import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Star, TrendingUp, Zap } from "lucide-react";

const LEVELS = {
  1: { name: "Novice", icon: "🌱", color: "text-green-600", bg: "bg-green-50" },
  2: { name: "Intermediate", icon: "📈", color: "text-blue-600", bg: "bg-blue-50" },
  3: { name: "Advanced", icon: "⭐", color: "text-purple-600", bg: "bg-purple-50" },
  4: { name: "Expert", icon: "🎯", color: "text-orange-600", bg: "bg-orange-50" },
  5: { name: "Master", icon: "👑", color: "text-yellow-600", bg: "bg-yellow-50" },
};

export default function MasteryDisplay({ clientEmail }) {
  const { data: masteries = [], isLoading } = useQuery({
    queryKey: ["behavior-mastery", clientEmail],
    queryFn: () =>
      base44.entities.BehaviorMastery.filter(
        { client_email: clientEmail },
        "-mastery_level",
        50
      ),
    enabled: !!clientEmail,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["behavior-milestones", clientEmail],
    queryFn: () =>
      base44.entities.BehaviorMilestone.filter(
        { client_email: clientEmail },
        "-earned_date",
        50
      ),
    enabled: !!clientEmail,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading mastery levels...
      </div>
    );
  }

  const masters = masteries.filter(m => m.mastery_level === 5);
  const experts = masteries.filter(m => m.mastery_level >= 4);
  const recentMilestones = milestones.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Mastery Grid */}
      {masteries.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Behavior Mastery ({masteries.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {masteries.map((mastery) => {
              const level = LEVELS[mastery.mastery_level];
              return (
                <div
                  key={mastery.id}
                  className={`rounded-xl p-4 border-2 border-transparent ${level.bg}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm">{mastery.behavior_name}</div>
                      <div className={`text-xs font-semibold ${level.color}`}>
                        {level.icon} {level.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">{mastery.mastery_level}</div>
                      <div className="text-[10px] text-muted-foreground">/5</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          mastery.mastery_level === 5
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${(mastery.mastery_level / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 text-[10px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> {mastery.streak_days}d streak
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> {mastery.total_logs} logs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Milestones */}
      {recentMilestones.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            🏆 Recent Milestones
          </h3>
          <div className="space-y-2">
            {recentMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-sm text-amber-900">
                    {milestone.behavior_name}
                  </p>
                  <p className="text-xs text-amber-800">
                    {milestone.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-600">+{milestone.xp_earned}</div>
                  <div className="text-[10px] text-amber-700">XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-lg font-black text-yellow-700">{masters.length}</div>
          <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
            Master
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-lg font-black text-orange-700">{experts.length}</div>
          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
            Expert+
          </div>
        </div>
      </div>

      {masteries.length === 0 && (
        <div className="text-center py-8 bg-muted rounded-xl">
          <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Start logging behaviors to unlock mastery levels!
          </p>
        </div>
      )}
    </div>
  );
}