import { parseISO, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Dog } from "lucide-react";

const MOOD_LABEL = {
  very_rough: "😣 Very Rough",
  rough: "😔 Rough",
};

export default function NeedsAttentionFeed({ behaviorLogs, onSelectClient }) {
  // Get very_rough logs from the last 14 days, deduplicated to most recent per dog
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const veryRoughLogs = behaviorLogs
    .filter(l => l.overall_mood === "very_rough" && l.log_date && parseISO(l.log_date) >= cutoff)
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  // Deduplicate: keep only the most recent per client+dog combo
  const seen = new Set();
  const deduplicated = veryRoughLogs.filter(l => {
    const key = `${l.client_email}__${l.dog_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduplicated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <Dog className="w-5 h-5 text-green-600" />
        </div>
        <div className="font-bold text-sm text-green-700 mb-1">All clear!</div>
        <p className="text-xs text-muted-foreground">No very rough sessions in the last 14 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deduplicated.map(l => (
        <button
          key={l.id}
          onClick={() => onSelectClient && onSelectClient(l.client_email)}
          className="w-full text-left bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-red-900">
                  {l.dog_name || "Dog"}
                </span>
                <span className="text-xs text-red-600/70 truncate">{l.client_email}</span>
              </div>
              <div className="text-xs text-red-700 mt-0.5">
                {MOOD_LABEL[l.overall_mood]} ·{" "}
                {formatDistanceToNow(parseISO(l.log_date), { addSuffix: true })}
              </div>
              {l.notes && (
                <p className="text-xs text-red-800/70 mt-1 line-clamp-2 italic">"{l.notes}"</p>
              )}
              {l.behaviors_observed?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {l.behaviors_observed.slice(0, 3).map(b => (
                    <span key={b} className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-red-500 font-semibold shrink-0 group-hover:underline">
              View →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}