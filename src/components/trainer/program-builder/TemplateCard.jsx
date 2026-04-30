import { Button } from "@/components/ui/button";
import { Edit2, Trash2, FileText, Target, BookOpen } from "lucide-react";

export default function TemplateCard({ template, onEdit, onDelete }) {
  const hasContent = (template.milestones?.length || 0) + (template.homework_tasks?.length || 0) > 0;

  return (
    <div className={`bg-card border rounded-2xl p-5 transition-all ${template.is_active ? "border-border hover:border-primary/40" : "border-border/50 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm md:text-base">{template.name}</h3>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
          )}
        </div>
        {!template.is_active && (
          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full shrink-0">
            Inactive
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-xs font-bold text-foreground">{template.sessions_total}</div>
          <div className="text-[10px] text-muted-foreground">Sessions</div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-xs font-bold text-foreground">{template.duration_weeks}w</div>
          <div className="text-[10px] text-muted-foreground">Duration</div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <div className="text-xs font-bold text-foreground">${template.price}</div>
          <div className="text-[10px] text-muted-foreground">Price</div>
        </div>
      </div>

      {/* Content indicators */}
      {hasContent && (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground px-3 py-2 bg-muted/20 rounded-lg">
          {template.milestones?.length > 0 && (
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>{template.milestones.length} milestone{template.milestones.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {template.homework_tasks?.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{template.homework_tasks.length} task{template.homework_tasks.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1 rounded-lg gap-1.5 text-xs"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="flex-1 rounded-lg gap-1.5 text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}