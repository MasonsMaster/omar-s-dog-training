import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

const COLORS = [
  "hsl(4,60%,40%)",
  "hsl(180,50%,20%)",
  "hsl(40,70%,50%)",
  "hsl(210,60%,45%)",
  "hsl(270,45%,48%)",
  "hsl(150,45%,35%)",
  "hsl(27,87%,55%)",
  "hsl(0,0%,45%)",
];

const MOOD_ORDER = ["great", "good", "neutral", "rough", "very_rough"];
const MOOD_LABEL = { great: "Great", good: "Good", neutral: "Neutral", rough: "Rough", very_rough: "Very Rough" };
const MOOD_COLOR = {
  great: "hsl(142,71%,45%)",
  good: "hsl(210,80%,55%)",
  neutral: "hsl(45,93%,47%)",
  rough: "hsl(27,87%,55%)",
  very_rough: "hsl(0,72%,51%)",
};

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
      <div className={`text-3xl font-black mb-1 ${accent ? "" : "text-foreground"}`}>{value}</div>
      <div className={`text-xs font-bold uppercase tracking-widest ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="font-bold text-base mb-4">{children}</h3>;
}

export default function AnalyticsDashboard({ schedules, homework, behaviorLogs, reports }) {
  // ── KPI computations ────────────────────────────────────────────────────────
  const totalPracticeMinutes = behaviorLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
  const totalPracticeHours = (totalPracticeMinutes / 60).toFixed(1);
  const practiceDaysCount = behaviorLogs.filter(l => l.practice_done).length;

  const completedSchedules = schedules.filter(s => s.status === "completed");
  const activeSchedules = schedules.filter(s => s.status === "active");
  const hwCompletionRate = homework.length
    ? Math.round((homework.filter(h => h.completed).length / homework.length) * 100)
    : 0;

  // ── Behavioral challenges frequency ────────────────────────────────────────
  const behaviorCounts = {};
  for (const log of behaviorLogs) {
    for (const b of (log.behaviors_observed || [])) {
      behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
    }
  }
  const topBehaviors = Object.entries(behaviorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // ── Program success rates ───────────────────────────────────────────────────
  const programStats = {};
  for (const s of schedules) {
    const key = s.program || "Unknown";
    if (!programStats[key]) programStats[key] = { total: 0, completed: 0, active: 0, paused: 0, sessions: 0, sessionsDone: 0 };
    programStats[key].total++;
    programStats[key][s.status] = (programStats[key][s.status] || 0) + 1;
    if (s.sessions_total) {
      programStats[key].sessions += s.sessions_total;
      programStats[key].sessionsDone += s.sessions_completed || 0;
    }
  }
  const programData = Object.entries(programStats)
    .map(([name, d]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "…" : name,
      fullName: name,
      successRate: d.total ? Math.round((d.completed / d.total) * 100) : 0,
      active: d.active || 0,
      completed: d.completed || 0,
      paused: d.paused || 0,
      avgProgress: d.sessions ? Math.round((d.sessionsDone / d.sessions) * 100) : 0,
    }))
    .sort((a, b) => b.active + b.completed - (a.active + a.completed));

  // ── Mood distribution ────────────────────────────────────────────────────────
  const moodCounts = {};
  for (const log of behaviorLogs) {
    if (log.overall_mood) moodCounts[log.overall_mood] = (moodCounts[log.overall_mood] || 0) + 1;
  }
  const moodData = MOOD_ORDER
    .filter(m => moodCounts[m])
    .map(m => ({ name: MOOD_LABEL[m], value: moodCounts[m], color: MOOD_COLOR[m] }));

  // ── Practice trend (last 8 weeks) ───────────────────────────────────────────
  const weekMap = {};
  for (const log of behaviorLogs) {
    if (!log.log_date) continue;
    const d = new Date(log.log_date);
    // Monday of that week
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toISOString().split("T")[0];
    if (!weekMap[key]) weekMap[key] = { week: key, logs: 0, practiceDays: 0, minutes: 0 };
    weekMap[key].logs++;
    if (log.practice_done) weekMap[key].practiceDays++;
    weekMap[key].minutes += log.duration_minutes || 0;
  }
  const weekTrend = Object.values(weekMap)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
    .map(w => ({ ...w, weekLabel: w.week.slice(5) })); // MM-DD

  // ── Homework difficulty breakdown ────────────────────────────────────────────
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  for (const h of homework) { if (diffCounts[h.difficulty] !== undefined) diffCounts[h.difficulty]++; }
  const diffData = [
    { name: "Easy", value: diffCounts.easy, color: "hsl(142,71%,45%)" },
    { name: "Medium", value: diffCounts.medium, color: "hsl(45,93%,47%)" },
    { name: "Hard", value: diffCounts.hard, color: "hsl(0,72%,51%)" },
  ].filter(d => d.value > 0);

  const CHART_STYLE = { fontSize: 11 };
  const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" };

  return (
    <div className="space-y-8">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Practice Hours" value={totalPracticeHours} sub={`${practiceDaysCount} practice sessions logged`} accent />
        <StatCard label="Homework Completion" value={`${hwCompletionRate}%`} sub={`${homework.filter(h => h.completed).length} of ${homework.length} tasks`} />
        <StatCard label="Active Programs" value={activeSchedules.length} sub={`${completedSchedules.length} completed`} />
        <StatCard label="Behavior Logs" value={behaviorLogs.length} sub={`${reports.length} weekly reports`} />
      </div>

      {/* Top row: Behaviors + Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Most Frequent Behavioral Challenges */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <SectionTitle>Most Frequent Behavioral Challenges</SectionTitle>
          {topBehaviors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No behavior data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topBehaviors} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={CHART_STYLE} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={CHART_STYLE} width={130} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]}>
                  {topBehaviors.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mood Distribution */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <SectionTitle>Overall Session Mood</SectionTitle>
          {moodData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No mood data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {moodData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {moodData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Practice Trend over Time */}
      {weekTrend.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <SectionTitle>Practice Activity — Last 8 Weeks</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-min" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(4,60%,40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(4,60%,40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-logs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(180,50%,20%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(180,50%,20%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="weekLabel" tick={CHART_STYLE} />
              <YAxis tick={CHART_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="minutes" name="Practice Min" stroke="hsl(4,60%,40%)" fill="url(#grad-min)" strokeWidth={2} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="logs" name="Logs Submitted" stroke="hsl(180,50%,20%)" fill="url(#grad-logs)" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Program Success Rates */}
      {programData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <SectionTitle>Training Program Breakdown</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Program", "Active", "Completed", "Paused", "Completion Rate", "Avg Session Progress"].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-primary tracking-widest pb-3 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programData.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-semibold" title={p.fullName}>{p.name}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p.active}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p.completed}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{p.paused}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${p.successRate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary">{p.successRate}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${p.avgProgress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-secondary">{p.avgProgress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Homework Difficulty Breakdown */}
      {diffData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <SectionTitle>Homework Difficulty Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={diffData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={4}>
                  {diffData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick business metrics */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <SectionTitle>Business Snapshot</SectionTitle>
            <div className="space-y-4">
              {[
                {
                  label: "Avg logs per client",
                  value: Object.keys(
                    behaviorLogs.reduce((m, l) => { m[l.client_email] = 1; return m; }, {})
                  ).length
                    ? (behaviorLogs.length / Object.keys(behaviorLogs.reduce((m, l) => { m[l.client_email] = 1; return m; }, {})).length).toFixed(1)
                    : "—",
                },
                {
                  label: "Avg practice mins / session",
                  value: practiceDaysCount
                    ? Math.round(totalPracticeMinutes / practiceDaysCount)
                    : "—",
                  suffix: "min",
                },
                {
                  label: "Program completion rate",
                  value: schedules.length
                    ? `${Math.round((completedSchedules.length / schedules.length) * 100)}%`
                    : "—",
                },
                {
                  label: "Weekly reports generated",
                  value: reports.length,
                },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-black text-lg text-primary">{value}{suffix ? ` ${suffix}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}