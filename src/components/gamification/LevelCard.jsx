import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy, Zap } from 'lucide-react';

const LEVEL_COLORS = [
  'bg-slate-100 text-slate-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
];

function getLevelColor(level) {
  const index = Math.min(Math.floor((level - 1) / 10), LEVEL_COLORS.length - 1);
  return LEVEL_COLORS[index];
}

function getLevelIcon(level) {
  if (level >= 50) return '👑';
  if (level >= 40) return '🏆';
  if (level >= 30) return '⭐';
  if (level >= 20) return '💎';
  if (level >= 10) return '🌟';
  return '🎖️';
}

export default function LevelCard({ clientEmail }) {
  const { data: userLevel, isLoading } = useQuery({
    queryKey: ['user-level', clientEmail],
    queryFn: () => base44.entities.UserLevel.filter({ client_email: clientEmail }).then(r => r[0]),
    enabled: !!clientEmail,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!userLevel) {
    return null;
  }

  const levelColor = getLevelColor(userLevel.current_level);
  const levelIcon = getLevelIcon(userLevel.current_level);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary rounded-2xl p-6 space-y-4">
      {/* Level display */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Your Level
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 ${levelColor} font-bold text-2xl`}>
            {levelIcon} Level {userLevel.current_level}
          </div>
        </div>
        <Trophy className="w-8 h-8 text-primary opacity-20" />
      </div>

      {/* XP progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-muted-foreground">Total XP</span>
          </div>
          <span className="text-sm font-bold text-primary">{userLevel.total_xp.toLocaleString()}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-background/50 rounded-full h-3 overflow-hidden border border-primary/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${userLevel.level_progress_percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">Progress to Level {userLevel.current_level + 1}</span>
          <span className="text-xs font-bold text-primary">{userLevel.level_progress_percent}%</span>
        </div>
      </div>

      {/* Level stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary/10">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Badges Earned</div>
          <div className="text-xl font-black text-primary">{userLevel.total_badges_earned || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">XP This Level</div>
          <div className="text-xl font-black text-secondary">{userLevel.xp_in_level}</div>
        </div>
      </div>
    </div>
  );
}