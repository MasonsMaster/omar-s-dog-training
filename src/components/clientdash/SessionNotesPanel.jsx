import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Video, BookOpen, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="font-bold text-sm">
            Session {session.session_number}
            {session.completed && <span className="ml-2 text-green-600">✓</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(session.session_date), "MMM d, yyyy")}
            {session.session_time && ` at ${session.session_time}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.overall_session_rating && (
            <div className="text-right">
              <div className="text-sm font-black text-primary">{session.overall_session_rating}/10</div>
              <div className="text-[10px] text-muted-foreground">Rating</div>
            </div>
          )}
          <div className="text-muted-foreground">{expanded ? "▲" : "▼"}</div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          {/* Focus areas */}
          {session.focus_areas?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-primary mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {session.focus_areas.map((area) => (
                  <span key={area} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Accomplishments */}
          {session.key_accomplishments?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-600 mb-2">✓ Key Accomplishments</p>
              <ul className="text-sm space-y-1">
                {session.key_accomplishments.map((acc, i) => (
                  <li key={i} className="text-foreground">• {acc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {session.areas_to_improve?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 mb-2">→ Areas to Improve</p>
              <ul className="text-sm space-y-1">
                {session.areas_to_improve.map((area, i) => (
                  <li key={i} className="text-foreground">• {area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ratings */}
          {(session.dog_behavior_rating || session.handler_responsiveness_rating) && (
            <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-3">
              {session.dog_behavior_rating && (
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Dog Behavior</div>
                  <div className="text-lg font-black text-primary">{session.dog_behavior_rating}/10</div>
                </div>
              )}
              {session.handler_responsiveness_rating && (
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Handler</div>
                  <div className="text-lg font-black text-primary">{session.handler_responsiveness_rating}/10</div>
                </div>
              )}
            </div>
          )}

          {/* Trainer notes */}
          {session.trainer_notes && (
            <div className="bg-secondary/5 border border-secondary/15 rounded-lg p-3">
              <div className="text-xs font-bold text-secondary mb-1.5">Trainer Notes</div>
              <p className="text-sm leading-relaxed">{session.trainer_notes}</p>
            </div>
          )}

          {/* Next session focus */}
          {session.next_session_focus && (
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
              <div className="text-xs font-bold text-primary mb-1.5">Next Session Focus</div>
              <p className="text-sm">{session.next_session_focus}</p>
            </div>
          )}

          {/* Homework assigned */}
          {session.homework_assigned?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">📝 Homework Assigned</p>
              <ul className="text-sm space-y-1">
                {session.homework_assigned.map((hw, i) => (
                  <li key={i} className="text-muted-foreground">• {hw}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Media */}
          <div className="flex gap-2">
            {session.video_url && (
              <a href={session.video_url} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 border border-primary/15 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors">
                  <Video className="w-3.5 h-3.5" /> Watch Session
                </button>
              </a>
            )}
            {session.photo_urls?.length > 0 && (
              <button className="flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/5 border border-secondary/15 px-3 py-2 rounded-lg hover:bg-secondary/10 transition-colors">
                <span>📸 {session.photo_urls.length} photos</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionNotesPanel({ clientEmail, scheduleId }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["session-notes", clientEmail],
    queryFn: () => 
      base44.entities.TrainingSession.filter({ client_email: clientEmail }, "-session_date", 50),
    enabled: !!clientEmail,
  });

  const filteredSessions = scheduleId
    ? sessions.filter(s => s.schedule_id === scheduleId)
    : sessions;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading session notes...
      </div>
    );
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="font-bold text-sm mb-1">No session notes yet</div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Your trainer will add detailed session notes after each training session so you can review what was covered and what to practice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredSessions.map(session => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}