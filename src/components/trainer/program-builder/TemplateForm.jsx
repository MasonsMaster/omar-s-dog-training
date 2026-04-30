import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplateForm({ template, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    sessions_total: template?.sessions_total || 6,
    duration_weeks: template?.duration_weeks || 6,
    price: template?.price || 0,
    milestones: template?.milestones || [],
    homework_tasks: template?.homework_tasks || [],
    is_active: template?.is_active !== false,
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addMilestone = () => {
    set("milestones", [...form.milestones, { session: 1, title: "", description: "" }]);
  };

  const updateMilestone = (idx, k, v) => {
    const updated = [...form.milestones];
    updated[idx][k] = v;
    set("milestones", updated);
  };

  const removeMilestone = (idx) => {
    set("milestones", form.milestones.filter((_, i) => i !== idx));
  };

  const addHomework = () => {
    set("homework_tasks", [...form.homework_tasks, { title: "", description: "", difficulty: "medium", session_assign: 1 }]);
  };

  const updateHomework = (idx, k, v) => {
    const updated = [...form.homework_tasks];
    updated[idx][k] = v;
    set("homework_tasks", updated);
  };

  const removeHomework = (idx) => {
    set("homework_tasks", form.homework_tasks.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Template name required"); return; }
    if (form.sessions_total < 1) { toast.error("At least 1 session required"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-6">
      <h3 className="font-bold text-base">{template ? "Edit Template" : "Create New Template"}</h3>

      {/* Basic info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Basic Information</h4>
        <Input
          placeholder="Template name *"
          value={form.name}
          onChange={e => set("name", e.target.value)}
          className="font-bold"
        />
        <Textarea
          placeholder="Description..."
          value={form.description}
          onChange={e => set("description", e.target.value)}
          className="min-h-[60px]"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Sessions</label>
            <Input type="number" value={form.sessions_total} onChange={e => set("sessions_total", Number(e.target.value))} min="1" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Duration (weeks)</label>
            <Input type="number" value={form.duration_weeks} onChange={e => set("duration_weeks", Number(e.target.value))} min="1" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Price ($)</label>
            <Input type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} min="0" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={e => set("is_active", e.target.checked)}
            className="w-4 h-4 rounded border border-input cursor-pointer"
          />
          <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Available for new assignments</label>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Milestones</h4>
          <Button size="sm" variant="outline" onClick={addMilestone} className="gap-1 rounded-full text-xs">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.milestones.map((m, idx) => (
            <div key={idx} className="bg-muted/40 rounded-lg p-3 space-y-2">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold block mb-0.5">Session #</label>
                  <Input
                    type="number"
                    value={m.session}
                    onChange={e => updateMilestone(idx, "session", Number(e.target.value))}
                    min="1"
                    max={form.sessions_total}
                    className="text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold block mb-0.5">Title</label>
                  <Input
                    placeholder="e.g., Master the sit"
                    value={m.title}
                    onChange={e => updateMilestone(idx, "title", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <button onClick={() => removeMilestone(idx)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                placeholder="Description..."
                value={m.description}
                onChange={e => updateMilestone(idx, "description", e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-transparent px-2 py-1.5 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          ))}
          {form.milestones.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No milestones yet</p>
          )}
        </div>
      </div>

      {/* Homework template tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Homework Tasks Template</h4>
          <Button size="sm" variant="outline" onClick={addHomework} className="gap-1 rounded-full text-xs">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.homework_tasks.map((hw, idx) => (
            <div key={idx} className="bg-muted/40 rounded-lg p-3 space-y-2">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold block mb-0.5">Task</label>
                  <Input
                    placeholder="e.g., Heel work 10 min daily"
                    value={hw.title}
                    onChange={e => updateHomework(idx, "title", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <button onClick={() => removeHomework(idx)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-0.5">Session #</label>
                  <Input
                    type="number"
                    value={hw.session_assign}
                    onChange={e => updateHomework(idx, "session_assign", Number(e.target.value))}
                    min="1"
                    max={form.sessions_total}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-0.5">Difficulty</label>
                  <select
                    value={hw.difficulty}
                    onChange={e => updateHomework(idx, "difficulty", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <textarea
                placeholder="Description..."
                value={hw.description}
                onChange={e => updateHomework(idx, "description", e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-transparent px-2 py-1.5 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          ))}
          {form.homework_tasks.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No homework template tasks yet</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} className="rounded-full gap-1">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {template ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}