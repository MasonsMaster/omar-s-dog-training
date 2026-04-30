import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoUploader from "./VideoUploader";
import VideoPlayer from "./VideoPlayer";
import { Video, ChevronLeft, MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VideosPanel({ clientEmail, currentUser }) {
  const queryClient = useQueryClient();
  const qKey = ["client-videos", clientEmail];
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.TrainingVideo.filter({ client_email: clientEmail }, "-created_date"),
    enabled: !!clientEmail,
  });

  const handleUploaded = (video) => {
    queryClient.invalidateQueries({ queryKey: qKey });
    setShowUpload(false);
    setSelected(video);
  };

  const handleUpdated = (updated) => {
    queryClient.setQueryData(qKey, (old = []) =>
      old.map((v) => (v.id === updated.id ? updated : v))
    );
    setSelected(updated);
  };

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to videos
        </button>
        <h3 className="font-bold text-lg mb-1">{selected.title}</h3>
        {selected.dog_name && <p className="text-sm text-muted-foreground mb-4">🐾 {selected.dog_name}</p>}
        <VideoPlayer video={selected} currentUser={currentUser} onUpdated={handleUpdated} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg">Training Videos</h2>
        <Button
          size="sm"
          variant={showUpload ? "outline" : "default"}
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-full font-bold gap-2"
        >
          {showUpload ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Upload Video</>}
        </Button>
      </div>

      {showUpload && (
        <div className="mb-6">
          <VideoUploader clientEmail={clientEmail} onUploaded={handleUploaded} />
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading videos...</div>
      ) : videos.length === 0 && !showUpload ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No videos yet</div>
          <p className="text-xs text-muted-foreground mb-4">Upload a training video to get timestamped feedback from Omar.</p>
          <Button size="sm" className="rounded-full font-bold gap-2" onClick={() => setShowUpload(true)}>
            <Plus className="w-3.5 h-3.5" /> Upload Your First Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className="text-left bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group"
            >
              {/* Thumbnail / placeholder */}
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                <video src={v.video_url} className="w-full h-full object-cover" preload="metadata" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-foreground border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-sm truncate">{v.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{formatDate(v.created_date)}</span>
                  {v.comments?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <MessageSquare className="w-3 h-3" /> {v.comments.length}
                    </span>
                  )}
                </div>
                {v.dog_name && <div className="text-xs text-muted-foreground mt-0.5">🐾 {v.dog_name}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}