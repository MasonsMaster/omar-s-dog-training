import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { format, parseISO, subDays, isWithinInterval } from "date-fns";

const BEHAVIOR_COLORS = {
  "Barking": "#ef4444",
  "Leash Pulling": "#f97316",
  "Jumping": "#eab308",
  "Sitting": "#22c55e",
  "Recall": "#3b82f6",
  "Biting": "#ec4899",
  "Aggression": "#8b5cf6",
  "Resource Guarding": "#f43f5e",
  "Separation Anxiety": "#06b6d4",
  "Door Manners": "#14b8a6",
  "Heel Work": "#6366f1",
  "Whining": "#a855f7",
};

export default function HabitTrendChart({ clientEmail, daysBack = 30 }) {
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["behavior-habits-chart", clientEmail, daysBack],
    queryFn: () => base44.entities.BehaviorHabit.filter({ client_email: clientEmail }, "-log_date", 300),
    enabled: !!clientEmail,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading trends...
      </div>
    );
  }

  // Filter by date range
  const startDate = subDays(new Date(), daysBack);
  const filteredHabits = habits.filter(h => {
    const logDate = parseISO(h.log_date);
    return isWithinInterval(logDate, { start: startDate, end: new Date() });
  });

  if (filteredHabits.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
        <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No data for selected period.</p>
      </div>
    );
  }

  // Aggregate by date and behavior
  const dateMap = {};
  const behaviorNames = new Set();

  filteredHabits.forEach(habit => {
    behaviorNames.add(habit.habit_name);
    if (!dateMap[habit.log_date]) {
      dateMap[habit.log_date] = {};
    }
    dateMap[habit.log_date][habit.habit_name] = (dateMap[habit.log_date][habit.habit_name] || 0) + habit.frequency;
  });

  // Create chart data
  const chartData = Object.entries(dateMap)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, behaviors]) => ({
      date: format(parseISO(date), "MMM d"),
      ...behaviors,
    }));

  const behaviors = Array.from(behaviorNames).sort();

  // Calculate stats
  const totalEntries = filteredHabits.length;
  const avgPerDay = (totalEntries / Math.max(1, chartData.length)).toFixed(1);
  const improvements = filteredHabits.filter(h => h.is_improvement).length;
  const mostFrequent = behaviors.reduce((max, behavior) => {
    const total = filteredHabits
      .filter(h => h.habit_name === behavior)
      .reduce((sum, h) => sum + h.frequency, 0);
    return { behavior, total };
  }, { behavior: "", total: 0 });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Total Logs</div>
          <div className="text-2xl font-black text-primary mt-1">{totalEntries}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Avg/Day</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{avgPerDay}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Improvements</div>
          <div className="text-2xl font-black text-green-600 mt-1">{improvements}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">Most Frequent</div>
          <div className="text-sm font-bold mt-1 truncate">{mostFrequent.behavior}</div>
          <div className="text-xs text-muted-foreground">{mostFrequent.total} times</div>
        </div>
      </div>

      {/* Frequency Trend Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-sm mb-4">Behavior Frequency Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            {behaviors.map(behavior => (
              <Line
                key={behavior}
                type="monotone"
                dataKey={behavior}
                stroke={BEHAVIOR_COLORS[behavior] || "#666"}
                strokeWidth={2}
                dot={{ fill: BEHAVIOR_COLORS[behavior] || "#666" }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Intensity Distribution */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-sm mb-4">Severity Distribution</h3>
        <div className="grid grid-cols-3 gap-3">
          {["mild", "moderate", "severe"].map(intensity => {
            const count = filteredHabits.filter(h => h.intensity === intensity).length;
            const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
            const colors = {
              mild: "bg-blue-100 text-blue-700",
              moderate: "bg-yellow-100 text-yellow-700",
              severe: "bg-red-100 text-red-700",
            };
            return (
              <div key={intensity} className={`rounded-xl p-4 text-center ${colors[intensity]}`}>
                <div className="text-2xl font-black">{count}</div>
                <div className="text-xs font-bold uppercase tracking-widest mt-1 capitalize">{intensity}</div>
                <div className="text-xs opacity-75 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Behavior Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-sm mb-4">Behavior Summary</h3>
        <div className="space-y-3">
          {behaviors.map(behavior => {
            const entries = filteredHabits.filter(h => h.habit_name === behavior);
            const total = entries.reduce((sum, h) => sum + h.frequency, 0);
            const improvements = entries.filter(h => h.is_improvement).length;
            const avgFreq = (total / entries.length).toFixed(1);
            return (
              <div key={behavior} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{behavior}</div>
                  <div className="text-xs text-muted-foreground">
                    {entries.length} logs · {avgFreq} avg frequency {improvements > 0 && `· ${improvements} improvements`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black" style={{ color: BEHAVIOR_COLORS[behavior] || "#666" }}>
                    {total}
                  </div>
                  <div className="text-[10px] text-muted-foreground">total</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}