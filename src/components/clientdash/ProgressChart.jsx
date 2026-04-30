import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Cell, Legend
} from "recharts";

function sessionPct(s) {
  return s.sessions_total ? Math.round((s.sessions_completed / s.sessions_total) * 100) : 0;
}

// Build a synthetic week-by-week timeline from start_date → today
function buildTimeline(schedule) {
  if (!schedule.start_date || !schedule.sessions_total) return [];
  const start = new Date(schedule.start_date);
  const today = new Date();
  const totalWeeks = Math.max(1, Math.ceil((today - start) / (7 * 24 * 60 * 60 * 1000)));
  const perWeek = schedule.sessions_completed / totalWeeks;
  return Array.from({ length: totalWeeks }, (_, i) => ({
    week: `Wk ${i + 1}`,
    sessions: Math.min(schedule.sessions_total, Math.round(perWeek * (i + 1))),
    goal: Math.min(schedule.sessions_total, Math.round((schedule.sessions_total / totalWeeks) * (i + 1))),
  }));
}

const COLORS = ["hsl(4,60%,40%)", "hsl(180,50%,20%)", "hsl(40,70%,50%)", "hsl(270,50%,50%)"];

export default function ProgressChart({ schedules, homework }) {
  if (!schedules.length && !homework.length) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No training data yet. Your progress will appear here after sessions begin.
      </div>
    );
  }

  // Radial data — session completion per dog
  const radialData = schedules
    .filter(s => s.sessions_total > 0)
    .map((s, i) => ({
      name: s.dog_name || s.program,
      value: sessionPct(s),
      fill: COLORS[i % COLORS.length],
    }));

  // Homework completion bar data
  const hwByDog = schedules.map(s => {
    const tasks = homework.filter(h => h.schedule_id === s.id || h.client_email === s.client_email);
    const done = tasks.filter(h => h.completed).length;
    return { name: s.dog_name || s.program, done, pending: tasks.length - done, total: tasks.length };
  }).filter(d => d.total > 0);

  // Timeline for first schedule with data
  const timelineSchedule = schedules.find(s => s.sessions_total > 0 && s.start_date);
  const timelineData = timelineSchedule ? buildTimeline(timelineSchedule) : [];

  return (
    <div className="space-y-8">

      {/* Session Progress — Radial */}
      {radialData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">Session Completion</h3>
          <p className="text-xs text-muted-foreground mb-6">Overall progress per program</p>
          <div className="flex flex-wrap items-center gap-8 justify-center">
            {radialData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="relative w-28 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="65%"
                      outerRadius="100%"
                      data={[{ ...d, full: 100 }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar dataKey="full" fill="hsl(var(--muted))" cornerRadius={8} background={false} />
                      <RadialBar dataKey="value" fill={d.fill} cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black">{d.value}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold">{d.name}</div>
                  <div className="text-[10px] text-muted-foreground" style={{ color: d.fill }}>
                    {schedules[i]?.sessions_completed ?? 0} / {schedules[i]?.sessions_total ?? 0} sessions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Timeline — Area Chart */}
      {timelineData.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">Sessions Over Time</h3>
          <p className="text-xs text-muted-foreground mb-6">
            {timelineSchedule.dog_name || timelineSchedule.program} — actual vs goal
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(4,60%,40%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(4,60%,40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-goal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(180,50%,20%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(180,50%,20%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="goal" name="Goal" stroke="hsl(180,50%,20%)" fill="url(#grad-goal)" strokeDasharray="4 2" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="sessions" name="Completed" stroke="hsl(4,60%,40%)" fill="url(#grad-actual)" strokeWidth={2} dot={{ r: 3, fill: "hsl(4,60%,40%)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Homework Bar Chart */}
      {hwByDog.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">Homework Milestones</h3>
          <p className="text-xs text-muted-foreground mb-6">Completed vs pending tasks per program</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hwByDog} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="done" name="Completed" stackId="a" fill="hsl(4,60%,40%)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}