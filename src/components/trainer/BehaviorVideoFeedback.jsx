import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";
import RealtimeMessaging from "@/components/messaging/RealtimeMessaging";
import { useState } from "react";

export default function BehaviorVideoFeedback({ clientEmail, currentUser, isTrainer = true }) {
  const [selectedLogId, setSelectedLogId] = useState(null);

  const { data: logsWithVideo = [], isLoading } = useQuery({
    queryKey: ["trainer-video-logs", clientEmail],
    queryFn: () =>
      base44.entities.BehaviorLog.filter(
        { client_email: clientEmail, video_url: { $exists: true } },
        "-log_date",
        20
      ),
    enabled: !!clientEmail,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-muted-foreground" />{" "}
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const unreviewed = logsWithVideo.filter(
    (l) => !l.video_comments || l.video_comments.length === 0
  );

  if (logsWithVideo.length === 0) {
    return (
      <div className="text-center py-8 bg-muted rounded-xl">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No practice videos yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      {unreviewed.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">
              {unreviewed.length} video{unreviewed.length !== 1 ? "s" : ""} needs
              feedback
            </p>
            <p className="text-xs text-amber-800">
              Add timestamped feedback to help clients improve.
            </p>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="space-y-2">
        {logsWithVideo.map((log) => (
          <button
            key={log.id}
            onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
              selectedLogId === log.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-sm">
                {new Date(log.log_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {log.video_comments?.length || 0} comments
              </span>
            </div>
            {log.dog_name && (
              <p className="text-xs text-muted-foreground">🐾 {log.dog_name}</p>
            )}
          </button>
        ))}
      </div>

      {/* Messaging for selected video */}
      {selectedLogId && currentUser && (
        <div className="border-t border-border pt-4 mt-4">
          <h4 className="font-bold text-sm mb-3">Give Feedback</h4>
          <RealtimeMessaging
            clientEmail={clientEmail}
            currentUser={currentUser}
            isTrainer={isTrainer}
            threadId={selectedLogId}
            threadType="log"
          />
        </div>
      )}
    </div>
  );
}