import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, Loader2, ClipboardList, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";

const MOOD_OPTIONS = [
  { value: "great",     label: "🌟 Great",     color: "border-green-500 bg-green-50 text-green-700" },
  { value: "good",      label: "😊 Good",      color: "border-blue-400 bg-blue-50 text-blue-700" },
  { value: "neutral",   label: "😐 Neutral",   color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { value: "rough",     label: "😔 Rough",     color: "border-orange-400 bg-orange-50 text-orange-700" },
  { value: "very_rough",label: "😣 Very Rough",color: "border-red-400 bg-red-50 text-red-700" },
];

const BEHAVIOR_TAGS = [
  "Leash Reactivity", "Recall", "Jumping", "Pulling", "Barking",
  "Aggression", "Separation Anxiety", "Resource Guarding",
  "Heel Work", "Sit/Stay", "Down/Stay", "Door Manners", "Socialization",
];

const MOOD_BG = {
  great: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  neutral: "bg-yellow-100 text-yellow-700",
  rough: "bg-orange-100 text-orange-700",
  very_rough: "bg-red-100 text-red-700",
};

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOOD_OPTIONS.find(m => m.value === log.overall_mood);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
            {format(parseISO(log.log_date), "MMM d")}
          </span>
          {mood && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${mood.color}`}>
              {mood.label}
            </span>
          )}
          {log.practice_done && (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Practiced
            </span>
          )}
          {log.duration_minutes > 0 && (
            <span className="text-xs text-muted-foreground">{log.duration_minutes} min</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {log.behaviors_observed?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {log.behaviors_observed.map(b => (
                <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">{b}</span>
              ))}
            </div>
          )}
          {log.notes && <p className="text-sm text-muted-foreground leading-relaxed">{log.notes}</p>}
        </div>
      )}
    </div>
  );
}

function NewLogForm({ clientEmail, dogNames, onSaved, onCancel }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    client_email: clientEmail,
    dog_name: dogNames[0] || "",
    log_date: today,
    overall_mood: "",
    behaviors_observed: [],
    notes: "",
    practice_done: false,
    duration_minutes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleBehavior = (b) => set("behaviors_observed",
    form.behaviors_observed.includes(b)
      ? form.behaviors_observed.filter(x => x !== b)
      : [...form.behaviors_observed, b]
  );

  const handleSave = async () => {
    if (!form.overall_mood) { toast.error("Please select a mood rating."); return; }
    setSaving(true);
    await base44.entities.BehaviorLog.create({
      ...form,
      duration_minutes: form.duration_minutes !== "" ? Number(form.duration_minutes) : undefined,
    });
    toast.success("Log saved! 🐾");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm">Today's Behavior Log</h3>

      {/* Dog + Date */}
      <div className="grid grid-cols-2 gap-3">
        {dogNames.length > 1 ? (
          <select
            value={form.dog_name}
            onChange={e => set("dog_name", e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {dogNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <Input placeholder="Dog's name" value={form.dog_name} onChange={e => set("dog_name", e.target.value)} />
        )}
        <Input type="date" value={form.log_date} onChange={e => set("log_date", e.target.value)} />
      </div>

      {/* Mood */}
      <div>
        <p className="text-xs font-semibold mb-2">How did it go today? *</p>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map(m => (
            <button key={m.value} onClick={() => set("overall_mood", m.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                form.overall_mood === m.value ? m.color : "border-border hover:border-primary/40"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Practice */}
      <div className="flex items-center gap-4">
        <button onClick={() => set("practice_done", !form.practice_done)} className="flex items-center gap-2 text-sm font-medium">
          {form.practice_done
            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
            : <Circle className="w-5 h-5 text-muted-foreground" />}
          Practiced today
        </button>
        {form.practice_done && (
          <Input
            type="number"
            placeholder="Minutes"
            value={form.duration_minutes}
            onChange={e => set("duration_minutes", e.target.value)}
            className="w-28 h-8 text-sm"
          />
        )}
      </div>

      {/* Behavior tags */}
      <div>
        <p className="text-xs font-semibold mb-2">Behaviors observed</p>
        <div className="flex flex-wrap gap-1.5">
          {BEHAVIOR_TAGS.map(b => (
            <button key={b} onClick={() => toggleBehavior(b)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                form.behaviors_observed.includes(b) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
              }`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <Textarea
        placeholder="Describe what happened — triggers, improvements, context..."
        value={form.notes}
        onChange={e => set("notes", e.target.value)}
        className="min-h-[80px]"
      />

      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full">Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save Log
        </Button>
      </div>
    </div>
  );
}

function WeeklyReportCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div className="font-bold text-sm">Week of {format(parseISO(report.week_start), "MMM d")} – {format(parseISO(report.week_end), "MMM d, yyyy")}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
            <span>{report.total_logs} logs</span>
            <span>{report.practice_days} practice days</span>
            {report.total_practice_minutes > 0 && <span>{report.total_practice_minutes} min total</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          {report.top_behaviors?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Top behaviors this week</p>
              <div className="flex flex-wrap gap-1.5">
                {report.top_behaviors.map(b => (
                  <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>
          )}
          {report.ai_summary && (
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2"><Sparkles className="w-3.5 h-3.5" /> AI Trend Summary</div>
              <p className="text-sm text-foreground leading-relaxed">{report.ai_summary}</p>
            </div>
          )}
          {report.trainer_notes && (
            <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-4">
              <div className="text-xs font-bold text-secondary mb-1">Trainer Notes</div>
              <p className="text-sm leading-relaxed">{report.trainer_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BehaviorLogPanel({ clientEmail, dogProfiles = [] }) {
  const qKey = ["behavior-logs", clientEmail];
  const reportKey = ["weekly-reports", clientEmail];
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("logs"); // "logs" | "reports"

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.BehaviorLog.filter({ client_email: clientEmail }, "-log_date", 30),
    enabled: !!clientEmail,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: reportKey,
    queryFn: () => base44.entities.WeeklyReport.filter({ client_email: clientEmail }, "-week_start", 12),
    enabled: !!clientEmail,
  });

  const dogNames = dogProfiles.map(p => p.name).filter(Boolean);

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: qKey });
    setShowForm(false);
  };

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[["logs", "Daily Logs"], ["reports", "Weekly Reports"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${view === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        {view === "logs" && (
          <Button size="sm" onClick={() => setShowForm(true)} className="rounded-full font-bold gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Log
          </Button>
        )}
      </div>

      {view === "logs" && (
        <div className="space-y-3">
          {showForm && (
            <NewLogForm
              clientEmail={clientEmail}
              dogNames={dogNames}
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          )}
          {loadingLogs ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading logs...</div>
          ) : logs.length === 0 && !showForm ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <div className="font-bold text-sm mb-1">No logs yet</div>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">Start logging daily observations to help your trainer track trends and adjust your program.</p>
              <Button size="sm" className="rounded-full font-bold gap-2" onClick={() => setShowForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Add First Log
              </Button>
            </div>
          ) : (
            logs.map(log => <LogEntry key={log.id} log={log} />)
          )}
        </div>
      )}

      {view === "reports" && (
        <div className="space-y-3">
          {loadingReports ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <div className="font-bold text-sm mb-1">No weekly reports yet</div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Weekly AI-generated trend reports appear here automatically every Monday after you've logged at least 3 days in a week.</p>
            </div>
          ) : (
            reports.map(r => <WeeklyReportCard key={r.id} report={r} />)
          )}
        </div>
      )}
    </div>
  );
}