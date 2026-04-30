import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock, Trophy, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

const BADGE_CONFIG = {
  'super_listener': {
    name: 'Super Listener',
    icon: '👂',
    color: 'from-blue-500 to-blue-600',
    description: 'Handler responsiveness rating averaged 9+/10 for 5+ sessions',
    rarity: 'rare',
  },
  'focus_master': {
    name: 'Focus Master',
    icon: '🎯',
    color: 'from-purple-500 to-purple-600',
    description: 'Dog behavior improved by 3+ points over training',
    rarity: 'rare',
  },
  'consistency_king': {
    name: 'Consistency King',
    icon: '👑',
    color: 'from-amber-500 to-amber-600',
    description: 'Maintained 7+ day streak of consistent training',
    rarity: 'epic',
  },
  'recall_rockstar': {
    name: 'Recall Rockstar',
    icon: '⭐',
    color: 'from-green-500 to-green-600',
    description: 'Mastered recall behavior to level 4+',
    rarity: 'rare',
  },
  'patience_champion': {
    name: 'Patience Champion',
    icon: '💜',
    color: 'from-pink-500 to-pink-600',
    description: 'Completed 10+ sessions without rating dips',
    rarity: 'epic',
  },
  'milestone_maker': {
    name: 'Milestone Maker',
    icon: '🏁',
    color: 'from-red-500 to-red-600',
    description: 'Achieved 5+ behavior milestones',
    rarity: 'rare',
  },
  'perfect_session': {
    name: 'Perfect Session',
    icon: '💯',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Achieved perfect 10/10 rating in a session',
    rarity: 'legendary',
  },
  'rising_star': {
    name: 'Rising Star',
    icon: '🌟',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Improved average rating by 2+ points in first 5 sessions',
    rarity: 'uncommon',
  },
};

function BadgeCard({ badge, earned, earnedDate }) {
  const config = BADGE_CONFIG[badge.id] || { name: badge.name, icon: '🎖️', color: 'from-gray-500 to-gray-600', description: '' };
  
  const rarityColors = {
    common: 'border-gray-300 bg-gray-50',
    uncommon: 'border-green-300 bg-green-50',
    rare: 'border-blue-300 bg-blue-50',
    epic: 'border-purple-300 bg-purple-50',
    legendary: 'border-yellow-300 bg-yellow-50',
  };

  return (
    <div className={`relative rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
      earned ? rarityColors[config.rarity] : 'border-dashed border-border bg-muted/30'
    }`}>
      {/* Lock overlay for locked badges */}
      {!earned && (
        <div className="absolute inset-0 rounded-2xl bg-black/10 flex items-center justify-center backdrop-blur-sm">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Badge content */}
      <div className="text-center space-y-3">
        <div className={`text-6xl mx-auto transition-transform ${earned ? 'scale-100' : 'opacity-50 scale-90'}`}>
          {config.icon}
        </div>

        <div>
          <h4 className={`font-bold text-sm ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {config.name}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
            {config.description}
          </p>
        </div>

        {/* Rarity badge */}
        <div className="inline-block">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            config.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
            config.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
            config.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
            config.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {config.rarity.charAt(0).toUpperCase() + config.rarity.slice(1)}
          </span>
        </div>

        {/* Earned date */}
        {earned && earnedDate && (
          <div className="text-[10px] font-semibold text-primary pt-1">
            ✓ Earned {new Date(earnedDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, current, target }) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className="text-muted-foreground">{current} / {target}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function BadgeCabinet({ clientEmail }) {
  const [filterRarity, setFilterRarity] = useState('all');

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['user-badges', clientEmail],
    queryFn: () =>
      base44.entities.UserBadge.filter({ client_email: clientEmail }, '-earned_date', 100),
    enabled: !!clientEmail,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['session-data-for-badges', clientEmail],
    queryFn: () =>
      base44.entities.TrainingSession.filter(
        { client_email: clientEmail },
        'session_date',
        200
      ),
    enabled: !!clientEmail,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones-for-badges', clientEmail],
    queryFn: () =>
      base44.entities.BehaviorMilestone.filter(
        { client_email: clientEmail },
        '-earned_date',
        100
      ),
    enabled: !!clientEmail,
  });

  // Calculate progress metrics
  const avgHandlerRating = sessions.filter(s => s.handler_responsiveness_rating).length > 0
    ? (sessions.reduce((sum, s) => sum + (s.handler_responsiveness_rating || 0), 0) / 
       sessions.filter(s => s.handler_responsiveness_rating).length).toFixed(1)
    : 0;

  const perfectSessions = sessions.filter(s => s.overall_session_rating === 10).length;
  const avgDogBehavior = sessions.filter(s => s.dog_behavior_rating).length > 0
    ? (sessions.reduce((sum, s) => sum + (s.dog_behavior_rating || 0), 0) /
       sessions.filter(s => s.dog_behavior_rating).length).toFixed(1)
    : 0;

  const firstSessionRating = sessions.length > 0 ? sessions[0].overall_session_rating : 0;
  const lastSessionRating = sessions.length > 0 ? sessions[sessions.length - 1].overall_session_rating : 0;
  const improvement = lastSessionRating - firstSessionRating;

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  const allBadges = Object.entries(BADGE_CONFIG).map(([id, config]) => ({
    id,
    ...config,
    earned: earnedBadgeIds.has(id),
    earnedDate: earnedBadges.find(b => b.badge_id === id)?.earned_date,
  }));

  const filteredBadges = filterRarity === 'all' 
    ? allBadges
    : allBadges.filter(b => b.rarity === filterRarity);

  const earnedCount = allBadges.filter(b => b.earned).length;
  const totalBadges = allBadges.length;

  return (
    <div className="space-y-8">
      {/* Overall Progress */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="font-bold text-sm mb-1">Badge Collection Progress</h3>
          <p className="text-xs text-muted-foreground">
            {earnedCount} of {totalBadges} badges unlocked
          </p>
        </div>

        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
          />
        </div>

        {/* Progress toward next badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
          <ProgressBar label="Handler Responsiveness" current={Math.min(avgHandlerRating, 10)} target={9} />
          <ProgressBar label="Perfect Sessions" current={perfectSessions} target={1} />
          <ProgressBar label="Dog Behavior Improvement" current={Math.max(0, improvement)} target={3} />
          <ProgressBar label="Behavior Milestones" current={milestones.length} target={5} />
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'uncommon', 'rare', 'epic', 'legendary'].map(rarity => (
          <button
            key={rarity}
            onClick={() => setFilterRarity(rarity)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterRarity === rarity
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {rarity === 'all' ? '🎖️ All Badges' :
             rarity === 'uncommon' ? '🟢 Uncommon' :
             rarity === 'rare' ? '🔵 Rare' :
             rarity === 'epic' ? '🟣 Epic' :
             '⭐ Legendary'}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      {filteredBadges.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No badges in this category</p>
          <p className="text-xs text-muted-foreground">Keep training to unlock more badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={badge.earned}
              earnedDate={badge.earnedDate}
            />
          ))}
        </div>
      )}

      {/* Tips section */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Unlocking Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
              <li>📊 <strong>Handler Responsiveness:</strong> Follow training instructions consistently to unlock Super Listener</li>
              <li>📈 <strong>Improvement:</strong> Show steady progress across sessions to earn Rising Star badges</li>
              <li>🎯 <strong>Milestones:</strong> Complete behavior training goals to unlock achievement badges</li>
              <li>⭐ <strong>Perfection:</strong> Achieve perfect 10/10 sessions to unlock exclusive rewards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}