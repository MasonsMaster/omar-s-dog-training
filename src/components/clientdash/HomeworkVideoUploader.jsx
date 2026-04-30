import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Video } from "lucide-react";
import { toast } from "sonner";

export default function HomeworkVideoUploader({ homeworkTask, clientEmail, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(`${homeworkTask.title} - Practice Video`);
  const queryClient = useQueryClient();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create training video record linked to homework
      await base44.entities.TrainingVideo.create({
        client_email: clientEmail,
        title: title.trim(),
        description: `Practice video for: ${homeworkTask.title}`,
        video_url: file_url,
        homework_id: homeworkTask.id,
      });

      toast.success("Video uploaded! Omar will review it shortly.");
      setTitle(`${homeworkTask.title} - Practice Video`);
      queryClient.invalidateQueries({ queryKey: ["homework-videos", homeworkTask.id] });
      onUploadComplete?.();
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-accent/30 border border-accent rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Upload Practice Video</h4>
      </div>

      <Input
        type="text"
        placeholder="Video title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={uploading}
        className="text-sm h-8"
      />

      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Click to upload or drag video</span>
          </>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Record yourself practicing this exercise and Omar will leave specific feedback.
      </p>
    </div>
  );
}