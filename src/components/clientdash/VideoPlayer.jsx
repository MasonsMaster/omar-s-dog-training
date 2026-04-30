import { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Clock } from "lucide-react";
import { toast } from "sonner";

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ video, currentUser, onUpdated }) {
  const videoRef = useRef();
  const [comments, setComments] = useState(video.comments || []);
  const [newComment, setNewComment] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setComments(video.comments || []); }, [video]);

  const sorted = [...comments].sort((a, b) => a.timestamp - b.timestamp);

  const jumpTo = (secs) => {
    if (videoRef.current) {
      videoRef.current.currentTime = secs;
      videoRef.current.play();
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const comment = {
      timestamp: Math.floor(currentTime),
      text: newComment.trim(),
      author: currentUser.full_name || currentUser.email,
      author_email: currentUser.email,
      is_trainer: currentUser.role === "admin",
      created_at: new Date().toISOString(),
    };
    const updatedComments = [...comments, comment];
    try {
      const updated = await base44.entities.TrainingVideo.update(video.id, { comments: updatedComments });
      setComments(updatedComments);
      setNewComment("");
      onUpdated(updated);
      toast.success("Comment added!");
    } catch (err) {
      toast.error("Failed to save comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video */}
      <div className="rounded-2xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          className="w-full h-full object-contain"
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Comment input */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Adding comment at <span className="font-bold text-foreground">{formatTime(currentTime)}</span></span>
          </div>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !submitting && addComment()}
              placeholder="Leave feedback at this timestamp..."
              className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="icon" onClick={addComment} disabled={submitting || !newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Pause the video at the moment you want to comment on, then type your note.</p>
        </div>

        {/* Comment list */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold">{sorted.length} Comment{sorted.length !== 1 ? "s" : ""}</span>
          </div>
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No comments yet. Be the first to add feedback!</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sorted.map((c, i) => (
                <div key={i} className={`rounded-lg p-3 text-sm ${c.is_trainer ? "bg-primary/5 border border-primary/15" : "bg-muted"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => jumpTo(c.timestamp)}
                      className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                    >
                      {formatTime(c.timestamp)}
                    </button>
                    <span className={`text-[10px] font-semibold ${c.is_trainer ? "text-primary" : "text-muted-foreground"}`}>
                      {c.is_trainer ? "🎓 Trainer · " : ""}{c.author}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}