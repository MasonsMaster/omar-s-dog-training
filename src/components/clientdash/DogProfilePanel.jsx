import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Check, X, Camera, Loader2, Dog } from "lucide-react";
import { toast } from "sonner";

const FOCUS_OPTIONS = [
  "Leash Reactivity", "Aggression", "Recall", "Jumping", "Pulling",
  "Separation Anxiety", "Resource Guarding", "Barking", "Socialization",
  "Basic Obedience", "Advanced Commands", "Impulse Control",
];

function ProfileCard({ profile, onEdit }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex gap-5 items-start">
      {/* Photo */}
      <div className="flex-shrink-0">
        {profile.photo_url ? (
          <img src={profile.photo_url} alt={profile.name} className="w-20 h-20 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Dog className="w-8 h-8 text-primary/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-bold text-lg leading-tight">{profile.name}</h3>
          <button onClick={() => onEdit(profile)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground mb-3">
          {profile.breed && <span>{profile.breed}</span>}
          {profile.age_years != null && <span>{profile.age_years} yr{profile.age_years !== 1 ? "s" : ""} old</span>}
          {profile.weight_lbs && <span>{profile.weight_lbs} lbs</span>}
          {profile.neutered != null && <span>{profile.neutered ? "Neutered/Spayed" : "Intact"}</span>}
        </div>

        {profile.behavioral_focus?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.behavioral_focus.map(f => (
              <span key={f} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
        )}

        {profile.notes && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 leading-relaxed">{profile.notes}</p>
        )}

        <div className="flex gap-3 mt-3 text-[10px] font-semibold text-muted-foreground">
          {profile.vaccination_current != null && (
            <span className={profile.vaccination_current ? "text-green-600" : "text-amber-600"}>
              {profile.vaccination_current ? "✓ Vaccinations current" : "⚠ Vaccinations not current"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ initial, clientEmail, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    client_email: clientEmail, name: "", breed: "", age_years: "",
    weight_lbs: "", photo_url: "", behavioral_focus: [], notes: "",
    neutered: null, vaccination_current: null,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleFocus = (f) => set("behavioral_focus",
    form.behavioral_focus?.includes(f)
      ? form.behavioral_focus.filter(x => x !== f)
      : [...(form.behavioral_focus || []), f]
  );

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Dog's name is required."); return; }
    setSaving(true);
    const payload = {
      ...form,
      age_years: form.age_years !== "" ? Number(form.age_years) : undefined,
      weight_lbs: form.weight_lbs !== "" ? Number(form.weight_lbs) : undefined,
    };
    let saved;
    if (form.id) {
      saved = await base44.entities.DogProfile.update(form.id, payload);
    } else {
      saved = await base44.entities.DogProfile.create(payload);
    }
    toast.success("Dog profile saved! 🐾");
    setSaving(false);
    onSave(saved);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-base">{form.id ? "Edit Profile" : "Add Dog Profile"}</h3>

      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          {form.photo_url ? (
            <img src={form.photo_url} alt="Dog" className="w-20 h-20 rounded-2xl object-cover border border-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Dog className="w-8 h-8 text-primary/50" />
            </div>
          )}
          <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 space-y-2">
          <Input placeholder="Dog's name *" value={form.name} onChange={e => set("name", e.target.value)} />
          <Input placeholder="Breed" value={form.breed} onChange={e => set("breed", e.target.value)} />
        </div>
      </div>

      {/* Age / Weight */}
      <div className="grid grid-cols-2 gap-3">
        <Input type="number" placeholder="Age (years)" value={form.age_years} onChange={e => set("age_years", e.target.value)} />
        <Input type="number" placeholder="Weight (lbs)" value={form.weight_lbs} onChange={e => set("weight_lbs", e.target.value)} />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold mb-2">Neutered / Spayed?</p>
          <div className="flex gap-2">
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => set("neutered", v)}
                className={`flex-1 py-1.5 text-xs rounded-lg border-2 font-semibold transition-all ${form.neutered === v ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2">Vaccinations current?</p>
          <div className="flex gap-2">
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => set("vaccination_current", v)}
                className={`flex-1 py-1.5 text-xs rounded-lg border-2 font-semibold transition-all ${form.vaccination_current === v ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Behavioral focus */}
      <div>
        <p className="text-xs font-semibold mb-2">Behavioral Focus Areas</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map(f => (
            <button key={f} onClick={() => toggleFocus(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                form.behavioral_focus?.includes(f) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <Textarea
        placeholder="Additional context for your trainer (medical history, past training, triggers, etc.)"
        value={form.notes}
        onChange={e => set("notes", e.target.value)}
        className="min-h-[80px]"
      />

      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 rounded-full">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 rounded-full font-bold">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}

export default function DogProfilePanel({ clientEmail }) {
  const qKey = ["dog-profiles", clientEmail];
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null = hidden, {} = new, profile = edit
  const [showForm, setShowForm] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.DogProfile.filter({ client_email: clientEmail }),
    enabled: !!clientEmail,
  });

  const handleSave = (saved) => {
    queryClient.invalidateQueries({ queryKey: qKey });
    setShowForm(false);
    setEditing(null);
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading profiles...</div>;

  return (
    <div className="space-y-4">
      {profiles.map(p =>
        editing?.id === p.id ? (
          <ProfileForm key={p.id} initial={editing} clientEmail={clientEmail} onSave={handleSave} onCancel={() => setEditing(null)} />
        ) : (
          <ProfileCard key={p.id} profile={p} onEdit={setEditing} />
        )
      )}

      {showForm && !editing && (
        <ProfileForm clientEmail={clientEmail} onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && !editing && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" /> Add a Dog Profile
        </button>
      )}
    </div>
  );
}