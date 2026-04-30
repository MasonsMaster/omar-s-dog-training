import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Edit2, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

const TREND_COLOR = {
  improving: "text-green-600 bg-green-50",
  stable: "text-amber-600 bg-amber-50",
  worsening: "text-red-600 bg-red-50",
  no_data: "text-muted-foreground bg-muted",
};

const STATUS_COLOR = {
  active: "text-blue-600 bg-blue-50",
  resolved: "text-green-600 bg-green-50",
  paused: "text-amber-600 bg-amber-50",
};

export default function ChallengeCard({ challenge, onEdit }) {
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["challenge-logs", challenge.id],
    queryFn: () => base44.entities.ChallengeLog.filter({ challenge_id: challenge.id }, "-log_date", 14),
  });

  const latestLog = recentLogs[0];
  const logsThisWeek = recentLogs.filter(l => {
    const logDate = new Date(l.log_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-sm">{challenge.challenge_name}</h3>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
          )}
        </div>
        <button onClick={() => onEdit?.(challenge)} className="p-1 hover:bg-accent rounded transition-colors">
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[challenge.status]}`}>
          {challenge.status}
        </span>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TREND_COLOR[challenge.improvement_trend]}`}>
          <TrendingUp className="w-3 h-3 inline mr-1" />
          {challenge.improvement_trend}
        </span>
      </div>

      {/* Recent activity */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {latestLog ? (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Last log: {formatDistanceToNow(parseISO(latestLog.log_date), { addSuffix: true })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-3.5 h-3.5" />
            No logs yet
          </div>
        )}
        <div>Logs this week: {logsThisWeek.length}/7</div>
      </div>

      {challenge.target_goal && (
        <div className="mt-3 p-2 bg-muted/40 rounded-lg text-xs leading-relaxed">
          <span className="font-semibold">Goal:</span> {challenge.target_goal}
        </div>
      )}
    </div>
  );
}