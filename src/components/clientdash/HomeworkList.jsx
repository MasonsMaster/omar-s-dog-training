import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import HomeworkVideoUploader from "./HomeworkVideoUploader";
import HomeworkVideoFeedback from "./HomeworkVideoFeedback";

const difficultyColors = {
  easy: "bg-green-100 text-green-600",
  medium: "bg-amber-100 text-amber-600",
  hard: "bg-red-100 text-red-600",
};

export default function HomeworkList({ tasks, queryKey }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const toggle = async (task) => {
    const newVal = !task.completed;
    await base44.entities.HomeworkTask.update(task.id, {
      completed: newVal,
      completed_date: newVal ? new Date().toISOString().split("T")[0] : null,
    });
    queryClient.invalidateQueries({ queryKey });
    toast.success(newVal ? "Nice work! Task marked complete 🐾" : "Task unmarked.");
  };

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No homework assigned yet. Check back after your next session!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={toggle} expanded={expanded} setExpanded={setExpanded} clientEmail={tasks[0]?.client_email} />
      ))}
      {done.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">Completed</div>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggle} expanded={expanded} setExpanded={setExpanded} clientEmail={tasks[0]?.client_email} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, expanded, setExpanded, clientEmail }) {
  const isOpen = expanded === task.id;
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${task.completed ? "border-border opacity-60" : "border-border"}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/40 transition-colors"
        onClick={() => setExpanded(isOpen ? null : task.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          className="flex-shrink-0"
        >
          {task.completed
            ? <Check className="w-5 h-5 text-primary" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </div>
          {task.due_date && (
            <div className="text-xs text-muted-foreground">Due {new Date(task.due_date).toLocaleDateString()}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColors[task.difficulty]}`}>
            {task.difficulty}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      {isOpen && (task.description || task.notes) && (
        <div className="px-4 pb-4 space-y-2 border-t border-border bg-muted/30">
          {task.description && (
            <p className="text-sm text-muted-foreground pt-3 leading-relaxed">{task.description}</p>
          )}
          {task.notes && (
            <div className="text-xs bg-background border border-border rounded-lg p-3 italic text-muted-foreground">
              📝 Your note: {task.notes}
            </div>
          )}
          <HomeworkVideoUploader homeworkTask={task} clientEmail={clientEmail} />
          <HomeworkVideoFeedback homeworkTask={task} />
        </div>
      )}
    </div>
  );
}