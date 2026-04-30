import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Image, Loader2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import ChallengeLogForm from "./ChallengeLogForm";

const INTENSITY_COLOR = {
  mild: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe: "bg-red-100 text-red-700",
};

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
            {format(parseISO(log.log_date), "MMM d")}
          </span>
          {log.behavior_observed ? (
            <>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${INTENSITY_COLOR[log.intensity]}`}>
                {log.intensity}
              </span>
              {log.photo_urls?.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="w-3 h-3" /> {log.photo_urls.length} photo(s)
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-green-600 font-semibold">✓ Not observed</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {log.behavior_observed ? (
            <>
              {log.trigger && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Trigger</p>
                  <p className="text-sm leading-relaxed">{log.trigger}</p>
                </div>
              )}
              {log.response && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Response</p>
                  <p className="text-sm leading-relaxed">{log.response}</p>
                </div>
              )}
              {log.outcome && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Outcome</p>
                  <p className="text-sm leading-relaxed">{log.outcome}</p>
                </div>
              )}
            </>
          ) : null}

          {log.photo_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Photos</p>
              <div className="flex flex-wrap gap-2">
                {log.photo_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-24 h-24 rounded-lg overflow-hidden border border-border hover:ring-2 ring-primary transition-all"
                  >
                    <img src={url} alt={`log-${idx}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {log.notes && (
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{log.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChallengeLogs({ challenge, clientEmail, dogName }) {
  const [showForm, setShowForm] = useState(false);
  const qKey = ["challenge-logs", challenge.id];
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.ChallengeLog.filter({ challenge_id: challenge.id }, "-log_date", 50),
  });

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: qKey });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className="rounded-full font-bold gap-2"
        >
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5" /> Add Log</>}
        </Button>
      </div>

      {showForm && (
        <ChallengeLogForm
          challenge={challenge}
          clientEmail={clientEmail}
          dogName={dogName}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No logs yet. Start tracking to see progress.
        </div>
      ) : (
        logs.map(log => <LogEntry key={log.id} log={log} />)
      )}
    </div>
  );
}