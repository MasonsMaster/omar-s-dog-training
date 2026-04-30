import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, CheckCircle2, Trash2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const COMMON_BEHAVIORS = [
  "Barking",
  "Leash Pulling",
  "Jumping",
  "Sitting",
  "Recall",
  "Biting",
  "Aggression",
  "Resource Guarding",
  "Separation Anxiety",
  "Door Manners",
  "Heel Work",
  "Whining",
];

const INTENSITY_COLORS = {
  mild: "bg-blue-100 text-blue-700 border-blue-300",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-300",
  severe: "bg-red-100 text-red-700 border-red-300",
};

export default function HabitTracker({ clientEmail, dogProfiles = [] }) {
  const qKey = ["behavior-habits", clientEmail];
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_email: clientEmail,
    dog_name: dogProfiles[0]?.name || "",
    habit_name: "",
    log_date: format(new Date(), "yyyy-MM-dd"),
    frequency: 1,
    intensity: "mild",
    context: "",
    notes: "",
    is_improvement: false,
  });

  const { data: habits = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.BehaviorHabit.filter({ client_email: clientEmail }, "-log_date", 100),
    enabled: !!clientEmail,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.habit_name.trim()) {
      toast.error("Please select or enter a behavior name");
      return;
    }
    
    await base44.entities.BehaviorHabit.create(form);
    toast.success("Behavior logged! 🐾");
    queryClient.invalidateQueries({ queryKey: qKey });
    setForm({
      client_email: clientEmail,
      dog_name: dogProfiles[0]?.name || "",
      habit_name: "",
      log_date: format(new Date(), "yyyy-MM-dd"),
      frequency: 1,
      intensity: "mild",
      context: "",
      notes: "",
      is_improvement: false,
    });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.BehaviorHabit.delete(id);
    toast.success("Behavior removed");
    queryClient.invalidateQueries({ queryKey: qKey });
  };

  const dogNames = dogProfiles.map(p => p.name).filter(Boolean);

  // Group by behavior name
  const behaviorGroups = {};
  habits.forEach(h => {
    if (!behaviorGroups[h.habit_name]) {
      behaviorGroups[h.habit_name] = [];
    }
    behaviorGroups[h.habit_name].push(h);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading habits...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Log Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm">Log a Behavior</h3>

          <div className="grid grid-cols-2 gap-3">
            {dogNames.length > 1 ? (
              <select
                value={form.dog_name}
                onChange={(e) => set("dog_name", e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {dogNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground py-2">{form.dog_name}</div>
            )}
            <Input type="date" value={form.log_date} onChange={(e) => set("log_date", e.target.value)} />
          </div>

          {/* Behavior Selection */}
          <div>
            <p className="text-xs font-semibold mb-2">Behavior *</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_BEHAVIORS.map((b) => (
                <button
                  key={b}
                  onClick={() => set("habit_name", b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    form.habit_name === b
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type custom behavior name..."
              value={form.habit_name}
              onChange={(e) => set("habit_name", e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Frequency & Intensity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-1">Frequency (1-10)</p>
              <Input
                type="number"
                min="1"
                max="10"
                value={form.frequency}
                onChange={(e) => set("frequency", Math.max(1, Math.min(10, Number(e.target.value))))}
              />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Intensity</p>
              <select
                value={form.intensity}
                onChange={(e) => set("intensity", e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm w-full"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          {/* Context */}
          <Input
            placeholder="Context (e.g., 'During walk', 'At home', 'With guests')"
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
            className="text-sm"
          />

          {/* Notes */}
          <textarea
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full h-16 px-3 py-2 rounded-md border border-input text-sm"
          />

          {/* Improvement Toggle */}
          <button
            onClick={() => set("is_improvement", !form.is_improvement)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            {form.is_improvement ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <div className="w-5 h-5 border-2 border-border rounded-full" />
            )}
            Mark as improvement
          </button>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-full">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} className="rounded-full font-bold">
              Log Behavior
            </Button>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full font-bold gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> Log Behavior
        </Button>
      )}

      {/* Behavior Groups */}
      {Object.keys(behaviorGroups).length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
          <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No behaviors logged yet</div>
          <p className="text-xs text-muted-foreground mb-4">Start logging to track behavioral trends over time.</p>
          <Button size="sm" className="rounded-full font-bold gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Log Your First Behavior
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(behaviorGroups).map(([behaviorName, entries]) => (
            <div key={behaviorName} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{behaviorName}</h4>
                  <p className="text-xs text-muted-foreground">{entries.length} log entries</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">
                          {format(new Date(entry.log_date), "MMM d")}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${INTENSITY_COLORS[entry.intensity]}`}>
                          {entry.intensity}
                        </span>
                        {entry.is_improvement && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            ✓ Improvement
                          </span>
                        )}
                      </div>
                      {entry.frequency > 0 && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Frequency: <span className="font-semibold">{entry.frequency}/10</span>
                        </div>
                      )}
                      {entry.context && (
                        <div className="text-xs text-muted-foreground mb-1">📍 {entry.context}</div>
                      )}
                      {entry.notes && (
                        <div className="text-xs bg-muted rounded px-2 py-1 mt-1">{entry.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}