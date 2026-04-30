import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Check, Calendar } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

export default function QuickAssignModal({ template, clientEmail, dogName, onClose, onSuccess }) {
  const [form, setForm] = useState({
    program: template.name,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addDays(new Date(), template.duration_weeks * 7), "yyyy-MM-dd"),
  });
  const [assigning, setAssigning] = useState(false);
  const qc = useQueryClient();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAssign = async () => {
    setAssigning(true);
    try {
      // Create schedule from template
      const schedule = await base44.entities.TrainingSchedule.create({
        client_email: clientEmail,
        dog_name: dogName,
        program: form.program,
        start_date: form.start_date,
        end_date: form.end_date,
        sessions_total: template.sessions_total,
        sessions_completed: 0,
        status: "active",
        notes: `Based on: ${template.name}`,
      });

      // Create homework tasks from template
      for (const hw of template.homework_tasks || []) {
        const dueDate = addDays(new Date(form.start_date), (hw.session_assign - 1) * 7);
        await base44.entities.HomeworkTask.create({
          client_email: clientEmail,
          schedule_id: schedule.id,
          title: hw.title,
          description: hw.description,
          difficulty: hw.difficulty,
          due_date: format(dueDate, "yyyy-MM-dd"),
          completed: false,
        });
      }

      // Create invoice
      await base44.entities.Invoice.create({
        client_email: clientEmail,
        schedule_id: schedule.id,
        program: template.name,
        dog_name: dogName,
        amount: template.price || 0,
        status: "pending",
        due_date: form.start_date,
      });

      qc.invalidateQueries({ queryKey: ["all-schedules"] });
      qc.invalidateQueries({ queryKey: ["all-homework"] });
      qc.invalidateQueries({ queryKey: ["all-invoices"] });
      
      toast.success(`Program assigned to ${dogName}!`);
      setAssigning(false);
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error("Failed to assign program");
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold">Quick Assign Program</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Program</label>
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm font-bold">
              {form.program}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Client Email</label>
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm">
              {clientEmail}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Dog Name</label>
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm">
              {dogName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => {
                  set("start_date", e.target.value);
                  const newEnd = format(addDays(new Date(e.target.value), template.duration_weeks * 7), "yyyy-MM-dd");
                  set("end_date", newEnd);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <Input
                type="date"
                value={form.end_date}
                onChange={e => set("end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1">
            <p className="font-semibold">Program Details:</p>
            <p>• {template.sessions_total} sessions over {template.duration_weeks} weeks</p>
            <p>• {template.homework_tasks?.length || 0} homework tasks included</p>
            <p>• ${template.price || 0} invoice created</p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={assigning}
            className="flex-1 rounded-lg font-bold gap-1"
          >
            {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}