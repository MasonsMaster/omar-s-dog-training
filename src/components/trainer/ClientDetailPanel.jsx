import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Dog, ClipboardList, BookOpen, BarChart2, MessageSquare, Loader2, Check, Pencil, X, Plus, CheckCircle2, Circle, Zap } from "lucide-react";
import TrainerMessagingPanel from "@/components/trainer/TrainerMessagingPanel";
import QuickAssignModal from "@/components/trainer/program-builder/QuickAssignModal";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const MOOD_LABEL = { great: "🌟 Great", good: "😊 Good", neutral: "😐 Neutral", rough: "😔 Rough", very_rough: "😣 Very Rough" };
const MOOD_COLOR = { great: "bg-green-100 text-green-700", good: "bg-blue-100 text-blue-700", neutral: "bg-yellow-100 text-yellow-700", rough: "bg-orange-100 text-orange-700", very_rough: "bg-red-100 text-red-700" };

const TABS = [
  { id: "overview", label: "Overview", icon: Dog },
  { id: "schedule", label: "Schedule", icon: ClipboardList },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "logs", label: "Behavior Logs", icon: ClipboardList },
  { id: "reports", label: "Weekly Reports", icon: BarChart2 },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

export default function ClientDetailPanel({ client, onBack }) {
  const [tab, setTab] = useState("overview");
  const [assignModal, setAssignModal] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["training-templates"],
    queryFn: () => base44.entities.TrainingTemplate.filter({ is_active: true }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button onClick={onBack} className="flex items-center gap-2 text-background/60 hover:text-background text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Clients
          </button>
          <h2 className="font-heading text-2xl md:text-3xl">{client.email}</h2>
          {client.dogs.length > 0 && (
            <div className="flex items-center gap-1.5 text-background/60 text-sm mt-1">
              <Dog className="w-4 h-4" />
              {client.dogs.map(d => d.name).filter(Boolean).join(", ")}
            </div>
          )}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: "Programs", val: client.schedules.length },
              { label: "Pending HW", val: client.homework.filter(h => !h.completed).length },
              { label: "Behavior Logs", val: client.logs.length },
              { label: "Reports", val: client.reports.length },
            ].map(({ label, val }) => (
              <div key={label} className="bg-background/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-black">{val}</div>
                <div className="text-[10px] font-bold tracking-widest text-background/50 uppercase">{label}</div>
              </div>
            ))}
          </div>

          {/* Quick assign button */}
          {templates.length > 0 && client.dogs.length > 0 && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-primary">Assign Program Template</div>
                <p className="text-xs text-primary/60 mt-0.5">Instantly create schedules from your templates</p>
              </div>
              <Button
                size="sm"
                onClick={() => setAssignModal(client.dogs[0])}
                className="rounded-lg font-bold gap-1 shrink-0 bg-primary hover:bg-primary/90"
              >
                <Zap className="w-3.5 h-3.5" /> Quick Assign
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === "overview" && <OverviewTab client={client} />}
        {tab === "schedule" && <ScheduleTab schedules={client.schedules} clientEmail={client.email} />}
        {tab === "homework" && <HomeworkTab homework={client.homework} clientEmail={client.email} />}
        {tab === "logs" && <LogsTab logs={client.logs} />}
        {tab === "reports" && <ReportsTab reports={client.reports} />}
        {tab === "messages" && (
          <TrainerMessagingPanel
            clientEmail={client.email}
            schedules={client.schedules}
            logs={client.logs}
          />
        )}
      </div>

      {/* Quick assign modal */}
      {assignModal && (
        <QuickAssignModal
          template={templates[0]}
          clientEmail={client.email}
          dogName={assignModal.name}
          onClose={() => setAssignModal(null)}
          onSuccess={() => {
            // Refresh client data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ client }) {
  return (
    <div className="space-y-6">
      {/* Dog profiles */}
      {client.dogs.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3">Dog Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.dogs.map(d => (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                {d.photo_url
                  ? <img src={d.photo_url} alt={d.name} className="w-16 h-16 rounded-xl object-cover" />
                  : <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center"><Dog className="w-6 h-6 text-primary/40" /></div>
                }
                <div>
                  <div className="font-bold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{[d.breed, d.age_years && `${d.age_years} yrs`, d.weight_lbs && `${d.weight_lbs} lbs`].filter(Boolean).join(" · ")}</div>
                  {d.behavioral_focus?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.behavioral_focus.map(f => (
                        <span key={f} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                  {d.notes && <p className="text-xs text-muted-foreground mt-2">{d.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logs summary */}
      {client.logs.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3">Recent Behavior ({client.logs.slice(0, 5).length} of {client.logs.length})</h3>
          <div className="space-y-2">
            {client.logs.slice(0, 5).map(l => (
              <div key={l.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14 shrink-0">{format(parseISO(l.log_date), "MMM d")}</span>
                {l.overall_mood && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${MOOD_COLOR[l.overall_mood]}`}>{MOOD_LABEL[l.overall_mood]}</span>}
                {l.practice_done && <span className="text-xs text-green-600 font-semibold">✓ Practiced {l.duration_minutes ? `${l.duration_minutes}m` : ""}</span>}
                {l.notes && <p className="text-xs text-muted-foreground truncate flex-1">{l.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest report */}
      {client.reports[0] && (
        <div>
          <h3 className="font-bold text-sm mb-3">Latest Weekly Report</h3>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-bold mb-1">Week of {client.reports[0].week_start}</div>
            <div className="flex gap-4 text-xs text-muted-foreground mb-3">
              <span>{client.reports[0].total_logs} logs</span>
              <span>{client.reports[0].practice_days} practice days</span>
              <span>{client.reports[0].total_practice_minutes} min</span>
            </div>
            {client.reports[0].ai_summary && (
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs font-bold text-primary mb-1">✨ AI Summary</div>
                <p className="text-sm leading-relaxed">{client.reports[0].ai_summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ schedules, clientEmail }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (schedule, updates) => {
    setSaving(true);
    await base44.entities.TrainingSchedule.update(schedule.id, updates);
    qc.invalidateQueries({ queryKey: ["all-schedules"] });
    setSaving(false);
    setEditing(null);
    toast.success("Schedule updated!");
  };

  const STATUS_COLOR = { active: "bg-green-100 text-green-700", completed: "bg-muted text-muted-foreground", paused: "bg-amber-100 text-amber-700" };

  return (
    <div className="space-y-4">
      {schedules.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No schedules yet.</div>}
      {schedules.map(s => (
        editing?.id === s.id ? (
          <ScheduleEditForm key={s.id} schedule={s} onSave={(updates) => handleUpdate(s, updates)} onCancel={() => setEditing(null)} saving={saving} />
        ) : (
          <div key={s.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold">{s.program}</div>
                <div className="text-sm text-muted-foreground">{s.dog_name || "—"} {s.breed && `· ${s.breed}`}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                <button onClick={() => setEditing(s)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
              </div>
            </div>
            {s.sessions_total > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Progress</span><span className="text-primary">{s.sessions_completed}/{s.sessions_total}</span>
                </div>
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((s.sessions_completed / s.sessions_total) * 100)}%` }} />
                </div>
              </div>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              {s.start_date && <span>Start: {s.start_date}</span>}
              {s.end_date && <span>End: {s.end_date}</span>}
            </div>
            {s.notes && <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{s.notes}</p>}
          </div>
        )
      ))}
    </div>
  );
}

function ScheduleEditForm({ schedule, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    sessions_completed: schedule.sessions_completed || 0,
    sessions_total: schedule.sessions_total || 0,
    status: schedule.status || "active",
    notes: schedule.notes || "",
    end_date: schedule.end_date || "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-card border-2 border-primary/30 rounded-xl p-5 space-y-4">
      <h4 className="font-bold text-sm">{schedule.program} — Edit</h4>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs font-semibold block mb-1">Sessions Done</label>
          <Input type="number" value={form.sessions_completed} onChange={e => set("sessions_completed", Number(e.target.value))} /></div>
        <div><label className="text-xs font-semibold block mb-1">Total Sessions</label>
          <Input type="number" value={form.sessions_total} onChange={e => set("sessions_total", Number(e.target.value))} /></div>
        <div><label className="text-xs font-semibold block mb-1">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {["active", "paused", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
      </div>
      <div><label className="text-xs font-semibold block mb-1">End Date</label>
        <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="max-w-[180px]" /></div>
      <div><label className="text-xs font-semibold block mb-1">Trainer Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          className="w-full min-h-[60px] text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
        </Button>
      </div>
    </div>
  );
}

// ─── Homework Tab ─────────────────────────────────────────────────────────────

function HomeworkTab({ homework, clientEmail }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", difficulty: "medium", due_date: "" });
  const [saving, setSaving] = useState(false);

  const pending = homework.filter(h => !h.completed);
  const done = homework.filter(h => h.completed);

  const toggleApprove = async (task) => {
    await base44.entities.HomeworkTask.update(task.id, {
      completed: !task.completed,
      completed_date: !task.completed ? new Date().toISOString().split("T")[0] : null,
    });
    qc.invalidateQueries({ queryKey: ["all-homework"] });
    toast.success(!task.completed ? "Marked complete!" : "Marked incomplete.");
  };

  const addTask = async () => {
    if (!newTask.title.trim()) { toast.error("Title required."); return; }
    setSaving(true);
    await base44.entities.HomeworkTask.create({ ...newTask, client_email: clientEmail });
    qc.invalidateQueries({ queryKey: ["all-homework"] });
    setSaving(false);
    setAdding(false);
    setNewTask({ title: "", description: "", difficulty: "medium", due_date: "" });
    toast.success("Homework task added!");
  };

  const DIFF_COLOR = { easy: "text-green-600 bg-green-50", medium: "text-amber-600 bg-amber-50", hard: "text-red-600 bg-red-50" };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(a => !a)} variant={adding ? "outline" : "default"} className="rounded-full font-bold gap-2">
          {adding ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Task</>}
        </Button>
      </div>

      {adding && (
        <div className="bg-card border-2 border-primary/30 rounded-xl p-5 space-y-3">
          <Input placeholder="Task title *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
          <textarea placeholder="Description..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
            className="w-full min-h-[60px] text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          <div className="flex gap-3">
            <select value={newTask.difficulty} onChange={e => setNewTask(p => ({ ...p, difficulty: e.target.value }))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm flex-1">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            <Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={addTask} disabled={saving} className="rounded-full font-bold gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Add Task
            </Button>
          </div>
        </div>
      )}

      {homework.length === 0 && !adding && <div className="text-center py-10 text-muted-foreground text-sm">No homework assigned yet.</div>}

      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending ({pending.length})</div>
          {pending.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <button onClick={() => toggleApprove(h)}>
                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{h.title}</div>
                {h.description && <div className="text-xs text-muted-foreground truncate">{h.description}</div>}
                {h.due_date && <div className="text-xs text-muted-foreground">Due {h.due_date}</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[h.difficulty] || ""}`}>{h.difficulty}</span>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">Completed ({done.length})</div>
          {done.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 opacity-70">
              <button onClick={() => toggleApprove(h)}>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm line-through text-muted-foreground">{h.title}</div>
                {h.completed_date && <div className="text-xs text-muted-foreground">Done {h.completed_date}</div>}
                {h.notes && <div className="text-xs italic text-muted-foreground">"{h.notes}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function LogsTab({ logs }) {
  return (
    <div className="space-y-2">
      {logs.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No behavior logs yet.</div>}
      {logs.map(l => (
        <div key={l.id} className="bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground w-14">{format(parseISO(l.log_date), "MMM d")}</span>
            {l.overall_mood && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${MOOD_COLOR[l.overall_mood]}`}>{MOOD_LABEL[l.overall_mood]}</span>}
            {l.dog_name && <span className="text-xs text-muted-foreground">🐾 {l.dog_name}</span>}
            {l.practice_done && <span className="text-xs text-green-600 font-semibold">✓ Practiced {l.duration_minutes ? `${l.duration_minutes}m` : ""}</span>}
          </div>
          {l.behaviors_observed?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {l.behaviors_observed.map(b => <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-0.5 rounded-full">{b}</span>)}
            </div>
          )}
          {l.notes && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.notes}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────

function ReportsTab({ reports }) {
  const [expanded, setExpanded] = useState(null);
  const [noteValues, setNoteValues] = useState({});
  const [saving, setSaving] = useState({});
  const qc = useQueryClient();

  const saveNotes = async (reportId, notes) => {
    setSaving(s => ({ ...s, [reportId]: true }));
    await base44.entities.WeeklyReport.update(reportId, { trainer_notes: notes });
    qc.invalidateQueries({ queryKey: ["all-reports"] });
    setSaving(s => ({ ...s, [reportId]: false }));
    toast.success("Notes saved!");
  };

  return (
    <div className="space-y-3">
      {reports.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No weekly reports yet.</div>}
      {reports.map(r => (
        <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/40 transition-colors text-left"
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div>
              <div className="font-bold text-sm">Week of {r.week_start} – {r.week_end}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.total_logs} logs · {r.practice_days} practice days · {r.total_practice_minutes} min</div>
            </div>
            <span className="text-xs text-muted-foreground">{expanded === r.id ? "▲" : "▼"}</span>
          </button>
          {expanded === r.id && (
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
              {r.top_behaviors?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.top_behaviors.map(b => <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">{b}</span>)}
                </div>
              )}
              {r.ai_summary && (
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-xs font-bold text-primary mb-1">✨ AI Summary</div>
                  <p className="text-sm leading-relaxed">{r.ai_summary}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-secondary mb-1.5">Your Notes (visible to client)</div>
                <textarea
                  value={noteValues[r.id] !== undefined ? noteValues[r.id] : (r.trainer_notes || "")}
                  onChange={e => setNoteValues(n => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Add session prep notes, patterns, recommendations..."
                  className="w-full min-h-[80px] text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={() => saveNotes(r.id, noteValues[r.id] ?? r.trainer_notes ?? "")}
                    disabled={saving[r.id]} className="rounded-full font-bold text-xs">
                    {saving[r.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Notes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}