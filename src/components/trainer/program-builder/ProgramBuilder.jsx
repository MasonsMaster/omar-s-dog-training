import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import TemplateCard from "./TemplateCard";
import TemplateForm from "./TemplateForm";

export default function ProgramBuilder() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["training-templates"],
    queryFn: () => base44.entities.TrainingTemplate.list("-created_date", 100),
  });

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await base44.entities.TrainingTemplate.update(editing.id, formData);
        toast.success("Template updated!");
      } else {
        await base44.entities.TrainingTemplate.create(formData);
        toast.success("Template created!");
      }
      qc.invalidateQueries({ queryKey: ["training-templates"] });
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template? Existing programs won't be affected.")) return;
    await base44.entities.TrainingTemplate.delete(id);
    qc.invalidateQueries({ queryKey: ["training-templates"] });
    toast.success("Template deleted");
  };

  const activeCount = templates.filter(t => t.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Training Program Templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create reusable programs for quick client assignments</p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setEditing(null); }}
          variant={showForm ? "outline" : "default"}
          className="rounded-full font-bold gap-2"
        >
          {showForm ? "Cancel" : <><Plus className="w-4 h-4" /> New Template</>}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <TemplateForm
          template={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Templates grid */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-bold text-sm mb-1">No templates yet</div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
            Create your first template to start building programs quickly.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)} className="rounded-full gap-2">
            <Plus className="w-3.5 h-3.5" /> Create Template
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Active: {activeCount} / {templates.length}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => { setEditing(t); setShowForm(true); }}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}