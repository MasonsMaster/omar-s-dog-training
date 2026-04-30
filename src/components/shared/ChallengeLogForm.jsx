import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ChallengeLogForm({ challenge, clientEmail, dogName, onSaved, onCancel }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    challenge_id: challenge.id,
    client_email: clientEmail,
    dog_name: dogName,
    log_date: today,
    behavior_observed: false,
    intensity: "mild",
    trigger: "",
    response: "",
    outcome: "",
    photo_urls: [],
    notes: "",
    is_trainer_log: false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const res = await base44.integrations.Core.UploadFile({ file });
        set("photo_urls", [...form.photo_urls, res.file_url]);
        setPhotoPreview(prev => [...prev, res.file_url]);
      }
      toast.success(`${files.length} photo(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload photos");
    }
    setUploading(false);
  };

  const removePhoto = (idx) => {
    set("photo_urls", form.photo_urls.filter((_, i) => i !== idx));
    setPhotoPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.log_date) {
      toast.error("Date required");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ChallengeLog.create(form);
      toast.success("Log saved!");
      setSaving(false);
      onSaved();
    } catch (error) {
      toast.error("Failed to save log");
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm">{challenge.challenge_name} — Daily Log</h3>

      {/* Date */}
      <div>
        <label className="text-xs font-semibold block mb-1">Date</label>
        <Input type="date" value={form.log_date} onChange={e => set("log_date", e.target.value)} />
      </div>

      {/* Behavior observed */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => set("behavior_observed", !form.behavior_observed)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            form.behavior_observed
              ? "bg-primary border-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          {form.behavior_observed && <span className="text-primary-foreground text-xs font-bold">✓</span>}
        </button>
        <span className="text-sm font-medium">Behavior observed today?</span>
      </div>

      {/* If behavior observed, show intensity */}
      {form.behavior_observed && (
        <>
          <div>
            <label className="text-xs font-semibold block mb-2">Intensity</label>
            <div className="flex gap-2">
              {["mild", "moderate", "severe"].map(level => (
                <button
                  key={level}
                  onClick={() => set("intensity", level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all capitalize ${
                    form.intensity === level
                      ? level === "mild"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : level === "moderate"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger, response, outcome */}
          <div>
            <label className="text-xs font-semibold block mb-1">What triggered it?</label>
            <Textarea
              placeholder="Describe the trigger..."
              value={form.trigger}
              onChange={e => set("trigger", e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">How did you respond?</label>
            <Textarea
              placeholder="Describe your response..."
              value={form.response}
              onChange={e => set("response", e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">What was the outcome?</label>
            <Textarea
              placeholder="Describe the outcome..."
              value={form.outcome}
              onChange={e => set("outcome", e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </>
      )}

      {/* Photo upload */}
      <div>
        <label className="text-xs font-semibold block mb-2">Photos</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {photoPreview.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}

          <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-muted-foreground" />
            )}
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-semibold block mb-1">Additional notes</label>
        <Textarea
          placeholder="Any other observations..."
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Save Log
        </Button>
      </div>
    </div>
  );
}