import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { parseISO, format } from 'date-fns';
import { TrendingUp, Award, Zap, AlertCircle } from 'lucide-react';

export default function ProgressChart({ clientEmail }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['progress-sessions-detailed', clientEmail],
    queryFn: () =>
      base44.entities.TrainingSession.filter(
        { client_email: clientEmail },
        'session_date',
        200
      ),
    enabled: !!clientEmail,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['behavior-milestones', clientEmail],
    queryFn: () =>
      base44.entities.BehaviorMilestone.filter(
        { client_email: clientEmail },
        '-earned_date',
        100
      ),
    enabled: !!clientEmail,
  });

  // Build session performance timeline
  const sessionTimeline = sessions
    .filter(s => s.session_date && s.overall_session_rating)
    .map(s => ({
      date: format(parseISO(s.session_date), 'MMM d'),
      rating: s.overall_session_rating,
      sessionNum: s.session_number,
      handlerRating: s.handler_responsiveness_rating,
      dogBehavior: s.dog_behavior_rating,
    }))
    .slice(0, 30);

  // Calculate trend (improvement over time)
  const calculateTrend = () => {
    if (sessionTimeline.length < 2) return null;
    const first3 = sessionTimeline.slice(0, 3).reduce((sum, s) => sum + s.rating, 0) / Math.min(3, sessionTimeline.length);
    const last3 = sessionTimeline.slice(-3).reduce((sum, s) => sum + s.rating, 0) / Math.min(3, sessionTimeline.length);
    const improvement = last3 - first3;
    return {
      trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable',
      change: Math.abs(improvement).toFixed(1),
    };
  };

  const trend = calculateTrend();

  // Handler vs Dog performance comparison
  const handlerDogComparison = sessions
    .filter(s => s.handler_responsiveness_rating && s.dog_behavior_rating && s.session_date)
    .map(s => ({
      session: `S${s.session_number || sessions.indexOf(s) + 1}`,
      handler: s.handler_responsiveness_rating,
      dog: s.dog_behavior_rating,
    }))
    .slice(-15);

  return (
    <div className="space-y-6">
      {/* Trend indicator */}
      {trend && (
        <div className={`bg-card border rounded-2xl p-4 flex items-center gap-4 ${
          trend.trend === 'up' ? 'border-green-500/30 bg-green-50' : 'border-border'
        }`}>
          <div className={`p-3 rounded-lg ${trend.trend === 'up' ? 'bg-green-100' : 'bg-amber-100'}`}>
            <TrendingUp className={`w-5 h-5 ${trend.trend === 'up' ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {trend.trend === 'up' ? '📈 Great Progress!' : trend.trend === 'down' ? '📉 Working Through Challenges' : '➡️ Steady Pace'}
            </p>
            <p className="text-xs text-muted-foreground">
              Average rating change: {trend.trend === 'up' ? '+' : ''}{trend.change} points
            </p>
          </div>
        </div>
      )}

      {/* Session Performance Timeline */}
      {sessionTimeline.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Performance Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={sessionTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tick={{ angle: -45, textAnchor: 'end', height: 60 }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Overall Rating"
              />
              <Line
                type="monotone"
                dataKey="dogBehavior"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                name="Dog Behavior"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Handler vs Dog Comparison */}
      {handlerDogComparison.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Handler vs Dog Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={handlerDogComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="session"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar dataKey="handler" fill="hsl(var(--primary))" name="Handler" radius={[8, 8, 0, 0]} />
              <Bar dataKey="dog" fill="hsl(var(--chart-2))" name="Dog" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Milestone Timeline */}
      {milestones.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Behavior Milestones Achieved</h3>
          <div className="space-y-3">
            {milestones.slice(0, 10).map((m, idx) => (
              <div key={m.id} className="flex gap-4 pb-3 border-b border-border last:border-0">
                <div className="flex-shrink-0 pt-1">
                  {m.milestone_type === '7_day_streak' && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  {m.milestone_type === 'mastery_level' && (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  {m.milestone_type === 'improvement_trend' && (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{m.behavior_name}</div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>
                      {m.milestone_type === '7_day_streak' && `${m.consecutive_days}-day streak`}
                      {m.milestone_type === 'mastery_level' && `Level ${m.mastery_level}`}
                      {m.milestone_type === 'improvement_trend' && 'Improvement trend'}
                    </span>
                    <span>+{m.xp_earned} XP</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground pt-1">
                  {format(parseISO(m.earned_date), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {sessionTimeline.length === 0 && milestones.length === 0 && (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No Progress Data Yet</p>
          <p className="text-xs text-muted-foreground">
            Complete training sessions to see performance charts and milestones.
          </p>
        </div>
      )}
    </div>
  );
}