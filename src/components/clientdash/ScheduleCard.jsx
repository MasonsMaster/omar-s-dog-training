import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock } from "lucide-react";

export default function ScheduleCard({ schedule }) {
  const pct = schedule.sessions_total
    ? Math.round((schedule.sessions_completed / schedule.sessions_total) * 100)
    : 0;

  const statusColors = {
    active: "bg-green-100 text-green-700",
    completed: "bg-secondary/10 text-secondary",
    paused: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-bold text-lg">{schedule.dog_name || "Your Dog"}</div>
          <div className="text-sm text-muted-foreground">{schedule.program}</div>
          {schedule.breed && <div className="text-xs text-muted-foreground">{schedule.breed}</div>}
        </div>
        <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${statusColors[schedule.status]}`}>
          {schedule.status}
        </span>
      </div>

      {/* Progress bar */}
      {schedule.sessions_total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span>Sessions Progress</span>
            <span className="text-primary">{schedule.sessions_completed} / {schedule.sessions_total}</span>
          </div>
          <div className="bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{pct}% complete</div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        {schedule.start_date && (
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Started {new Date(schedule.start_date).toLocaleDateString()}
          </div>
        )}
        {schedule.end_date && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Ends {new Date(schedule.end_date).toLocaleDateString()}
          </div>
        )}
      </div>

      {schedule.notes && (
        <p className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg p-3 leading-relaxed">
          {schedule.notes}
        </p>
      )}
    </div>
  );
}