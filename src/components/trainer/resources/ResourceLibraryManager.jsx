import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["fundamentals", "intermediate", "advanced", "behavioral_challenges", "health_wellness", "nutrition"];
const RESOURCE_TYPES = ["video", "document", "guide"];
const SAMPLE_TAGS = ["leash_training", "recall", "sit_stay", "aggression", "separation_anxiety", "jumping", "barking", "socialization", "puppy", "advanced"];

export default function ResourceLibraryManager() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const qc = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["training-resources"],
    queryFn: () => base44.entities.TrainingResource.list("-created_date", 200),
  });

  const filtered = resources.filter(r =>
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())) &&
    (filterCategory === "all" || r.category === filterCategory)
  );

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    await base44.entities.TrainingResource.delete(id);
    qc.invalidateQueries({ queryKey: ["training-resources"] });
    toast.success("Resource deleted");
  };

  const togglePublish = async (resource) => {
    await base44.entities.TrainingResource.update(resource.id, { is_published: !resource.is_published });
    qc.invalidateQueries({ queryKey: ["training-resources"] });
    toast.success(resource.is_published ? "Unpublished" : "Published");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
        <Button
          onClick={() => { setShowForm(!showForm); setEditing(null); }}
          className="rounded-full font-bold gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Resource"}
        </Button>
      </div>

      {showForm && <ResourceForm resource={editing} onSave={async (data) => {
        if (editing) {
          await base44.entities.TrainingResource.update(editing.id, data);
          toast.success("Resource updated");
        } else {
          await base44.entities.TrainingResource.create(data);
          toast.success("Resource created");
        }
        qc.invalidateQueries({ queryKey: ["training-resources"] });
        setShowForm(false);
        setEditing(null);
      }} />}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No resources found.</div>}
          {filtered.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.title}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="capitalize">{r.resource_type}</span>
                  <span className="capitalize">{r.category.replace(/_/g, " ")}</span>
                  {r.duration_minutes && <span>{r.duration_minutes} min</span>}
                </div>
                {r.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                    {r.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{r.tags.length - 3}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(r)} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                  {r.is_published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceForm({ resource, onSave }) {
  const [form, setForm] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    resource_type: resource?.resource_type || "video",
    category: resource?.category || "fundamentals",
    tags: resource?.tags || [],
    file_url: resource?.file_url || "",
    thumbnail_url: resource?.thumbnail_url || "",
    duration_minutes: resource?.duration_minutes || "",
    is_published: resource?.is_published || false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (tag) => set("tags", form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.file_url.trim()) {
      toast.error("Title and file URL required");
      return;
    }
    setSaving(true);
    await onSave({
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
    });
    setSaving(false);
  };

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm">{resource ? "Edit" : "New"} Resource</h3>
      <Input placeholder="Title *" value={form.title} onChange={e => set("title", e.target.value)} />
      <Textarea placeholder="Description..." value={form.description} onChange={e => set("description", e.target.value)} className="min-h-[60px]" />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.resource_type} onChange={e => set("resource_type", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.category} onChange={e => set("category", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <Input placeholder="File URL *" value={form.file_url} onChange={e => set("file_url", e.target.value)} />
      <Input placeholder="Thumbnail URL" value={form.thumbnail_url} onChange={e => set("thumbnail_url", e.target.value)} />
      {form.resource_type === "video" && (
        <Input type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} />
      )}
      <div>
        <p className="text-xs font-semibold mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_TAGS.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                form.tags.includes(t) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.is_published} onChange={e => set("is_published", e.target.checked)} className="rounded" />
        <label htmlFor="pub" className="text-sm">Publish to clients</label>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-full">Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}