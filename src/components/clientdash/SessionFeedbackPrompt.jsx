import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react';
import SessionFeedbackForm from './SessionFeedbackForm';
import { format, parseISO } from 'date-fns';

export default function SessionFeedbackPrompt({ clientEmail, clientName, dogProfiles }) {
  const [expandedSession, setExpandedSession] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

  const { data: sessions = [] } = useQuery({
    queryKey: ['completed-sessions-no-feedback', clientEmail],
    queryFn: async () => {
      const all = await base44.entities.TrainingSession.filter(
        { client_email: clientEmail, completed: true },
        '-session_date',
        50
      );

      // Get feedback records
      const feedback = await base44.entities.SessionFeedback.filter(
        { client_email: clientEmail }
      );
      const feedbackSessionIds = new Set(feedback.map(f => f.session_id));

      // Return sessions without feedback
      return all.filter(s => !feedbackSessionIds.has(s.id));
    },
    enabled: !!clientEmail,
  });

  const pendingCount = sessions.length - dismissed.size;

  if (pendingCount === 0) return null;

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        if (dismissed.has(session.id)) return null;

        const dogName = dogProfiles?.find(d => d.name === session.dog_name)?.name || session.dog_name;
        const isExpanded = expandedSession === session.id;

        return (
          <div
            key={session.id}
            className="bg-primary/5 border border-primary/15 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3 text-left flex-1">
                <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <div className="font-semibold text-sm">
                    How was your session on {format(parseISO(session.session_date), 'MMM d')}?
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Share your feedback and help other dog owners 🐾
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissed(prev => new Set([...prev, session.id]));
                  }}
                  className="text-muted-foreground hover:text-foreground p-1"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t border-primary/10 pt-4">
                <SessionFeedbackForm
                  session={session}
                  clientEmail={clientEmail}
                  clientName={clientName}
                  dogName={dogName}
                  onSubmitted={() => {
                    setExpandedSession(null);
                    setDismissed(prev => new Set([...prev, session.id]));
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}