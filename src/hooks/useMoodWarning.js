import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Returns a set of day-of-week indices (0=Sun) that have a "very_rough" pattern.
 * A day is flagged if >=40% of its logged sessions were very_rough (min 3 logs on that day).
 */
export function useMoodWarning(clientEmail) {
  const { data: logs = [] } = useQuery({
    queryKey: ["behavior-logs-mood", clientEmail],
    queryFn: () => clientEmail
      ? base44.entities.BehaviorLog.filter({ client_email: clientEmail })
      : Promise.resolve([]),
    enabled: !!clientEmail,
    staleTime: 5 * 60 * 1000,
  });

  // Aggregate by day of week
  const dayStats = Array.from({ length: 7 }, () => ({ total: 0, rough: 0 }));
  for (const log of logs) {
    if (!log.log_date) continue;
    const dow = new Date(log.log_date + "T12:00:00").getDay();
    dayStats[dow].total++;
    if (log.overall_mood === "very_rough") dayStats[dow].rough++;
  }

  const flaggedDays = new Set();
  for (let i = 0; i < 7; i++) {
    const { total, rough } = dayStats[i];
    if (total >= 3 && rough / total >= 0.4) {
      flaggedDays.add(i);
    }
  }

  const getWarning = (isoDatetime) => {
    if (!isoDatetime || flaggedDays.size === 0) return null;
    const dow = new Date(isoDatetime).getDay();
    if (!flaggedDays.has(dow)) return null;
    const { total, rough } = dayStats[dow];
    const pct = Math.round((rough / total) * 100);
    return {
      day: DAY_NAMES[dow],
      pct,
      total,
    };
  };

  return { flaggedDays, getWarning, hasData: logs.length >= 3 };
}