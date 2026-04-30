import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Video, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VideoUploader({ clientEmail, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [dogName, setDogName] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file || !title.trim()) { toast.error("Please add a title."); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const video = await base44.entities.TrainingVideo.create({
        client_email: clientEmail,
        title: title.trim(),
        dog_name: dogName.trim(),
        video_url: file_url,
        comments: [],
      });
      toast.success("Video uploaded! Your trainer will review it soon. 🐾");
      setFile(null); setTitle(""); setDogName("");
      onUploaded(video);
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-sm">Upload a Training Video</h3>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"
          }`}
        >
          <Video className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Drag & drop a video or <span className="text-primary font-semibold">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">MP4, MOV, WebM — max ~200MB</p>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-border rounded-xl p-4 bg-muted/30">
          <Video className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <Input placeholder="Video title *" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Dog's name (optional)" value={dogName} onChange={(e) => setDogName(e.target.value)} />
          <Button onClick={submit} disabled={uploading} className="w-full rounded-xl font-bold gap-2">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Submit for Review</>}
          </Button>
        </div>
      )}
    </div>
  );
}