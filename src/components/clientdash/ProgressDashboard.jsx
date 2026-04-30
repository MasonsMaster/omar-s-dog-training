import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Trophy, Target, Clock, Zap, Loader2, TrendingUp } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground font-semibold mb-1">{label}</div>
          <div className="flex items-baseline gap-1">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${color.replace("text-", "bg-").replace("-700", "-100")}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function ProgressDashboard({ clientEmail, dogProfiles = [] }) {
  const { data: schedules = [] } = useQuery({
    queryKey: ["progress-schedules", clientEmail],
    queryFn: () => base44.entities.TrainingSchedule.filter({ client_email: clientEmail }),
    enabled: !!clientEmail,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["progress-sessions", clientEmail],
    queryFn: () => base44.entities.TrainingSession.filter({ client_email: clientEmail }, "-session_date", 100),
    enabled: !!clientEmail,
  });

  const { data: userLevel } = useQuery({
    queryKey: ["user-level", clientEmail],
    queryFn: () => base44.entities.UserLevel.filter({ client_email: clientEmail }).then(r => r[0]),
    enabled: !!clientEmail,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["user-badges", clientEmail],
    queryFn: () => base44.entities.UserBadge.filter({ client_email: clientEmail }, "-earned_date"),
    enabled: !!clientEmail,
  });

  // Calculate metrics
  const totalHours = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalSessions = schedules.reduce((sum, s) => sum + s.sessions_total, 0);
  const avgRating = sessions.filter(s => s.overall_session_rating).length > 0
    ? (sessions.reduce((sum, s) => sum + (s.overall_session_rating || 0), 0) / sessions.filter(s => s.overall_session_rating).length).toFixed(1)
    : "—";

  // Weekly progress data
  const weeklyData = {};
  sessions.forEach(s => {
    if (s.session_date) {
      const week = format(parseISO(s.session_date), "MMM d");
      if (!weeklyData[week]) weeklyData[week] = { week, hours: 0, sessions: 0, rating: 0, count: 0 };
      weeklyData[week].hours += (s.duration_minutes || 0) / 60;
      weeklyData[week].sessions += 1;
      weeklyData[week].rating += s.overall_session_rating || 0;
      weeklyData[week].count += 1;
    }
  });
  
  const weeklyChartData = Object.values(weeklyData).map(w => ({
    week: w.week,
    hours: Math.round(w.hours * 10) / 10,
    rating: w.count > 0 ? Math.round((w.rating / w.count) * 10) / 10 : 0,
  })).slice(-8);

  // Focus area distribution
  const focusAreas = {};
  sessions.forEach(s => {
    s.focus_areas?.forEach(area => {
      focusAreas[area] = (focusAreas[area] || 0) + 1;
    });
  });
  const focusData = Object.entries(focusAreas).map(([name, value]) => ({ name, value })).slice(0, 6);

  // Performance distribution
  const performanceRatings = sessions.filter(s => s.overall_session_rating).map(s => s.overall_session_rating);
  const performanceData = [
    { name: "1-3", count: performanceRatings.filter(r => r <= 3).length },
    { name: "4-6", count: performanceRatings.filter(r => r > 3 && r <= 6).length },
    { name: "7-9", count: performanceRatings.filter(r => r > 6 && r <= 9).length },
    { name: "10", count: performanceRatings.filter(r => r === 10).length },
  ];

  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

  if (!sessions.length && !userLevel) {
    return (
      <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
        <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="font-bold text-sm mb-1">No training data yet</div>
        <p className="text-xs text-muted-foreground">
          Your progress dashboard will appear here once you complete your first training session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Level" value={userLevel?.current_level || 1} unit="" color="text-primary" />
        <StatCard icon={Clock} label="Total Hours" value={totalHours.toFixed(1)} unit="hrs" color="text-blue-700" />
        <StatCard icon={Target} label="Sessions" value={completedSessions} unit={`/ ${totalSessions}`} color="text-green-700" />
        <StatCard icon={Zap} label="Avg Rating" value={avgRating} unit="/10" color="text-amber-700" />
      </div>

      {/* XP & Level Progress */}
      {userLevel && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Level Progression</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>Level {userLevel.current_level}</span>
                <span className="text-muted-foreground">{Math.round(userLevel.level_progress_percent)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${userLevel.level_progress_percent}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <div className="text-muted-foreground">Total XP</div>
                <div className="font-bold text-foreground mt-0.5">{userLevel.total_xp.toLocaleString()} XP</div>
              </div>
              <div>
                <div className="text-muted-foreground">Badges Earned</div>
                <div className="font-bold text-foreground mt-0.5">{userLevel.total_badges_earned}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Progress Chart */}
      {weeklyChartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Weekly Training Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} name="Hours" dot={{ fill: "hsl(var(--primary))" }} />
              <Line yAxisId="right" type="monotone" dataKey="rating" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Avg Rating" dot={{ fill: "hsl(var(--chart-2))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        {performanceData.some(d => d.count > 0) && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4">Performance Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={performanceData.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-xs">
              {performanceData.map((d, i) => d.count > 0 && (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                    <span className="text-muted-foreground">Rating {d.name}</span>
                  </div>
                  <span className="font-semibold">{d.count} sessions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Focus Areas */}
        {focusData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4">Focus Areas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={focusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Sessions" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Badges */}
      {badges.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges.slice(0, 8).map(badge => (
              <div key={badge.id} className="text-center">
                <div className="text-3xl mb-1">{badge.badge_name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(badge.earned_date), "MMM d, yyyy")}
                </div>
                <div className="text-[10px] font-bold text-primary mt-0.5">+{badge.xp_earned} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}