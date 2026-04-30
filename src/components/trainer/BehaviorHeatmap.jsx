import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Returns 0=Mon … 6=Sun from a log_date string
function getDayIndex(dateStr) {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ shifts
  return (d.getDay() + 6) % 7; // convert Sun=0 → Mon=0
}

function getMoodSeverity(mood) {
  return { great: 0, good: 0.25, neutral: 0.5, rough: 0.75, very_rough: 1 }[mood] ?? 0.5;
}

// Interpolate from green → amber → red based on intensity 0–1
function heatColor(intensity, alpha = 1) {
  if (intensity === 0) return `rgba(220,220,220,${alpha * 0.4})`;
  // green(0) → amber(0.5) → red(1)
  let r, g, b;
  if (intensity < 0.5) {
    const t = intensity * 2;
    r = Math.round(34 + t * (251 - 34));
    g = Math.round(197 + t * (191 - 197));
    b = Math.round(94 + t * (36 - 94));
  } else {
    const t = (intensity - 0.5) * 2;
    r = Math.round(251 + t * (185 - 251));
    g = Math.round(191 + t * (28 - 191));
    b = Math.round(36 + t * (26 - 36));
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

function HeatCell({ value, maxValue, label, sub, size = "md" }) {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  const bg = heatColor(intensity);
  const textColor = intensity > 0.55 ? "#fff" : "#374151";
  const padding = size === "sm" ? "p-2" : "p-3";

  return (
    <div
      className={`${padding} rounded-lg flex flex-col items-center justify-center transition-all cursor-default select-none`}
      style={{ background: bg }}
      title={`${label}${sub ? ` · ${sub}` : ""}: ${value} issue${value !== 1 ? "s" : ""}`}
    >
      <div className="text-base font-black leading-none" style={{ color: textColor }}>{value || 0}</div>
      {sub && <div className="text-[9px] font-semibold mt-0.5 opacity-70" style={{ color: textColor }}>{sub}</div>}
    </div>
  );
}

export default function BehaviorHeatmap({ behaviorLogs }) {
  const [mode, setMode] = useState("frequency"); // "frequency" | "mood" | "behavior"
  const [selectedBehavior, setSelectedBehavior] = useState(null);

  // Build all unique behaviors
  const allBehaviors = [...new Set(
    behaviorLogs.flatMap(l => l.behaviors_observed || [])
  )].sort();

  // ── Day-of-week aggregation ──────────────────────────────────────────────────
  const dayStats = Array.from({ length: 7 }, () => ({
    count: 0, issueCount: 0, moodSum: 0, moodCount: 0, behaviorCounts: {}
  }));

  for (const log of behaviorLogs) {
    if (!log.log_date) continue;
    const di = getDayIndex(log.log_date);
    const behaviors = log.behaviors_observed || [];

    dayStats[di].count++;

    if (behaviors.length > 0) {
      dayStats[di].issueCount += behaviors.length;
      for (const b of behaviors) {
        dayStats[di].behaviorCounts[b] = (dayStats[di].behaviorCounts[b] || 0) + 1;
      }
    }

    if (log.overall_mood) {
      dayStats[di].moodSum += getMoodSeverity(log.overall_mood);
      dayStats[di].moodCount++;
    }
  }

  // ── Values for selected mode ─────────────────────────────────────────────────
  const dayValues = dayStats.map((d, i) => {
    if (mode === "frequency") return { val: d.issueCount, sub: `${d.count} log${d.count !== 1 ? "s" : ""}` };
    if (mode === "mood") {
      const avg = d.moodCount ? d.moodSum / d.moodCount : 0;
      return { val: Math.round(avg * 100), sub: d.moodCount ? `avg ${(avg * 5).toFixed(1)}/5` : "no data" };
    }
    if (mode === "behavior" && selectedBehavior) {
      return { val: d.behaviorCounts[selectedBehavior] || 0, sub: `${d.count} log${d.count !== 1 ? "s" : ""}` };
    }
    return { val: 0, sub: "" };
  });

  const maxVal = Math.max(...dayValues.map(d => d.val), 1);

  // ── Hottest day ──────────────────────────────────────────────────────────────
  const hottestIdx = dayValues.reduce((maxI, d, i, arr) => d.val > arr[maxI].val ? i : maxI, 0);
  const hottestDay = dayValues[hottestIdx].val > 0 ? DAY_FULL[hottestIdx] : null;

  // ── Top 5 behaviors per day (for tooltip-style breakdown) ────────────────────
  const topBehaviorsByDay = dayStats.map(d =>
    Object.entries(d.behaviorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
  );

  // ── Weekly behavior distribution for bottom bar chart ───────────────────────
  const behaviorByDay = allBehaviors.slice(0, 8).map(b => ({
    name: b,
    days: dayStats.map(d => d.behaviorCounts[b] || 0),
  }));

  const noData = behaviorLogs.length === 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base">Behavior Issue Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify the hottest days for behavior challenges and mood trends
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: "frequency", label: "Issue Frequency" },
            { id: "mood", label: "Mood Severity" },
            { id: "behavior", label: "By Behavior" },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                mode === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-muted-foreground"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Behavior selector (only in "behavior" mode) */}
      {mode === "behavior" && (
        <div className="flex flex-wrap gap-1.5">
          {allBehaviors.length === 0 ? (
            <span className="text-xs text-muted-foreground">No behaviors logged yet.</span>
          ) : allBehaviors.map(b => (
            <button key={b} onClick={() => setSelectedBehavior(b === selectedBehavior ? null : b)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedBehavior === b
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-muted-foreground text-muted-foreground"
              }`}>
              {b}
            </button>
          ))}
        </div>
      )}

      {noData ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No behavior logs yet — data will appear as clients submit their daily logs.
        </div>
      ) : (
        <>
          {/* Main heatmap row */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => (
              <div key={day} className="flex flex-col gap-1.5">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">{day}</div>
                <HeatCell
                  value={dayValues[i].val}
                  maxValue={maxVal}
                  label={DAY_FULL[i]}
                  sub={dayValues[i].sub}
                />
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-semibold">Low</span>
            <div className="flex gap-0.5 flex-1 max-w-[160px]">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
                <div key={v} className="flex-1 h-2.5 rounded-sm" style={{ background: heatColor(v) }} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">High</span>
            {hottestDay && (
              <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                🔥 Hottest: {hottestDay}
              </span>
            )}
          </div>

          {/* Top behaviors per day breakdown */}
          {mode === "frequency" && topBehaviorsByDay.some(d => d.length > 0) && (
            <div className="border-t border-border pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Top Issues per Day</div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, i) => (
                  <div key={day} className="space-y-1">
                    <div className="text-[9px] font-black text-muted-foreground uppercase text-center">{day}</div>
                    {topBehaviorsByDay[i].length === 0 ? (
                      <div className="text-[9px] text-muted-foreground text-center opacity-50">—</div>
                    ) : topBehaviorsByDay[i].map(b => (
                      <div key={b} className="text-[9px] text-center font-medium bg-primary/5 text-primary border border-primary/10 rounded px-1 py-0.5 leading-tight">{b}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavior frequency by day (stacked view) */}
          {mode === "frequency" && behaviorByDay.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Behavior Frequency by Day</div>
              <div className="space-y-2">
                {behaviorByDay.map(({ name, days }) => {
                  const total = days.reduce((s, v) => s + v, 0);
                  if (total === 0) return null;
                  const maxD = Math.max(...days, 1);
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-32 truncate shrink-0" title={name}>{name}</div>
                      <div className="flex gap-0.5 flex-1">
                        {days.map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${DAY_FULL[i]}: ${v}`}>
                            <div className="w-full rounded-sm" style={{
                              height: `${Math.max(v > 0 ? 8 : 2, Math.round((v / maxD) * 32))}px`,
                              background: v > 0 ? heatColor(v / maxD) : "hsl(var(--muted))",
                            }} />
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-primary w-8 text-right shrink-0">{total}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-0.5 mt-1 pl-[140px]">
                {DAYS.map(d => <div key={d} className="flex-1 text-center text-[9px] text-muted-foreground font-bold">{d}</div>)}
              </div>
            </div>
          )}

          {/* Mood mode explanation */}
          {mode === "mood" && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-3">
              <span>0 = All "Great" sessions</span>
              <span>·</span>
              <span>100 = All "Very Rough" sessions</span>
              <span>·</span>
              <span>Score based on average daily mood severity</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}