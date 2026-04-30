import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Video, MessageSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";

export default function HomeworkVideoFeedback({ homeworkTask }) {
  const [expanded, setExpanded] = useState(false);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["homework-videos", homeworkTask.id],
    queryFn: () => base44.entities.TrainingVideo.filter({ homework_id: homeworkTask.id }),
  });

  if (isLoading) {
    return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading videos...</div>;
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {videos.map((video) => {
        const feedbackCount = video.comments?.filter(c => c.is_trainer).length || 0;
        return (
          <div key={video.id} className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === video.id ? null : video.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-blue-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold text-sm text-blue-900">{video.title}</div>
                  <div className="text-xs text-blue-700">{format(parseISO(video.created_date), "MMM d, h:mm a")}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {feedbackCount > 0 && (
                  <span className="flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    <MessageSquare className="w-2.5 h-2.5" /> {feedbackCount}
                  </span>
                )}
                {expanded === video.id ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
              </div>
            </button>

            {expanded === video.id && (
              <div className="px-3 pb-3 border-t border-blue-200 space-y-2">
                <video src={video.video_url} controls className="w-full rounded-lg bg-black mt-2" />
                {video.comments?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {video.comments.map((comment, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg ${comment.is_trainer ? "bg-green-100 border border-green-200" : "bg-white border border-blue-100"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{comment.is_trainer ? "🎯 Omar's Feedback" : comment.author}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.timestamp ? `@ ${Math.floor(comment.timestamp)}s` : ""} · {format(parseISO(comment.created_at), "MMM d")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}