import { format, parseISO, differenceInDays } from "date-fns";
import { Dog, Clock, CheckCircle2, PauseCircle } from "lucide-react";

const STATUS_COLOR = {
  active: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICON = {
  active: CheckCircle2,
  paused: PauseCircle,
  completed: CheckCircle2,
};

export default function ActiveProgramsPanel({ schedules }) {
  const active = schedules.filter(s => s.status === "active");

  if (active.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No active programs right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {active.map(s => {
        const pct = s.sessions_total > 0
          ? Math.round((s.sessions_completed / s.sessions_total) * 100)
          : null;
        const daysLeft = s.end_date
          ? differenceInDays(parseISO(s.end_date), new Date())
          : null;

        const StatusIcon = STATUS_ICON[s.status] || CheckCircle2;

        return (
          <div key={s.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Dog className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm truncate">{s.dog_name || "Dog"}</span>
                <span className="text-xs text-muted-foreground truncate">{s.client_email}</span>
              </div>
              <div className="text-xs text-muted-foreground">{s.program}</div>
              {pct !== null && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden max-w-[120px]">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {s.sessions_completed}/{s.sessions_total} sessions
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[s.status]}`}>
                {s.status}
              </span>
              {daysLeft !== null && (
                <span className={`flex items-center gap-1 text-[10px] font-semibold ${daysLeft <= 7 ? "text-red-500" : "text-muted-foreground"}`}>
                  <Clock className="w-3 h-3" />
                  {daysLeft <= 0 ? "Ended" : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}