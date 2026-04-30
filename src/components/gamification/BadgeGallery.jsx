import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock } from 'lucide-react';

const RARITY_COLORS = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-300 bg-green-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

const RARITY_BG = {
  common: 'bg-gray-100',
  uncommon: 'bg-green-100',
  rare: 'bg-blue-100',
  epic: 'bg-purple-100',
  legendary: 'bg-yellow-100',
};

export default function BadgeGallery({ clientEmail }) {
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
  });

  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user-badges', clientEmail],
    queryFn: () => base44.entities.UserBadge.filter({ client_email: clientEmail }),
    enabled: !!clientEmail,
  });

  if (loadingBadges || loadingUserBadges) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(b => b.badge_id));

  const categories = ['sessions', 'vaccinations', 'homework', 'behavior', 'milestone'];

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Badges earned: <span className="font-bold text-primary">{userBadges.length}</span> / {allBadges.length}
        </div>
        {userBadges.length === allBadges.length && (
          <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full flex items-center gap-1">
            ✨ Collection Complete!
          </span>
        )}
      </div>

      {/* Badges by category */}
      {categories.map(category => {
        const categoryBadges = allBadges.filter(b => b.category === category);
        if (categoryBadges.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-bold capitalize mb-3 text-foreground">
              {category} Badges
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryBadges.map(badge => {
                const isEarned = earnedBadgeIds.has(badge.id);
                const userBadge = userBadges.find(b => b.badge_id === badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      isEarned
                        ? `${RARITY_COLORS[badge.rarity]}`
                        : 'border-muted bg-muted/30 opacity-50'
                    }`}
                    title={badge.criteria}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      {/* Badge icon */}
                      <div
                        className={`text-4xl ${isEarned ? '' : 'opacity-30 grayscale'}`}
                      >
                        {isEarned ? badge.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
                      </div>

                      {/* Badge name */}
                      <div>
                        <div className="text-xs font-bold">{badge.name}</div>
                        <div className="text-[10px] text-muted-foreground">{badge.criteria}</div>
                      </div>

                      {/* XP + rarity */}
                      <div className="flex items-center gap-2 justify-center pt-2 border-t border-current border-opacity-10 w-full">
                        <span className="text-xs font-bold text-yellow-600">+{badge.xp_reward || 10} XP</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                          badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                          badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                          badge.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {badge.rarity}
                        </span>
                      </div>

                      {/* Earned date */}
                      {isEarned && userBadge?.earned_date && (
                        <div className="text-[10px] text-muted-foreground italic">
                          Earned {new Date(userBadge.earned_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}