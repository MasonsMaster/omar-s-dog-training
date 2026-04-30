import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionBadge from "@/components/shared/SectionBadge";
import ClientRow from "@/components/trainer/ClientRow";
import ClientDetailPanel from "@/components/trainer/ClientDetailPanel";
import AnalyticsDashboard from "@/components/trainer/AnalyticsDashboard";
import BillingView from "@/components/trainer/BillingView";
import WeeklyReportStudio from "@/components/trainer/WeeklyReportStudio";
import { Search, Users, ClipboardList, BookOpen, BarChart2, TrendingUp, DollarSign, Loader2, Shield, LayoutDashboard } from "lucide-react";
import ActiveProgramsPanel from "@/components/trainer/overview/ActiveProgramsPanel";
import NeedsAttentionFeed from "@/components/trainer/overview/NeedsAttentionFeed";
import QuickReplyInbox from "@/components/trainer/overview/QuickReplyInbox";
import ProgramBuilder from "@/components/trainer/program-builder/ProgramBuilder";
import { Settings } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "programs", label: "Program Templates", icon: Settings },
  { id: "clients", label: "Active Clients", icon: Users },
  { id: "schedules", label: "Schedules", icon: ClipboardList },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "reports", label: "Weekly Reports", icon: BarChart2 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "billing", label: "Billing", icon: DollarSign },
];

export default function TrainerHub() {
  const { user, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  const { data: schedules = [], isLoading: loadingSched } = useQuery({
    queryKey: ["all-schedules"],
    queryFn: () => base44.entities.TrainingSchedule.list("-created_date", 200),
    enabled: user?.role === "admin",
  });

  const { data: homework = [], isLoading: loadingHW } = useQuery({
    queryKey: ["all-homework"],
    queryFn: () => base44.entities.HomeworkTask.list("-created_date", 200),
    enabled: user?.role === "admin",
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["all-reports"],
    queryFn: () => base44.entities.WeeklyReport.list("-week_start", 200),
    enabled: user?.role === "admin",
  });

  const { data: dogProfiles = [] } = useQuery({
    queryKey: ["all-dog-profiles"],
    queryFn: () => base44.entities.DogProfile.list(),
    enabled: user?.role === "admin",
  });

  const { data: behaviorLogs = [] } = useQuery({
    queryKey: ["all-behavior-logs"],
    queryFn: () => base44.entities.BehaviorLog.list("-log_date", 500),
    enabled: user?.role === "admin",
  });

  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-heading text-2xl mb-2">Trainer Access Only</h2>
        <p className="text-muted-foreground text-sm">This area is restricted to authorized trainers.</p>
      </div>
    );
  }

  // Derive unique clients from schedules
  const clientMap = {};
  for (const s of schedules) {
    if (!s.client_email) continue;
    if (!clientMap[s.client_email]) clientMap[s.client_email] = { email: s.client_email, schedules: [], homework: [], reports: [], dogs: [], logs: [] };
    clientMap[s.client_email].schedules.push(s);
  }
  for (const h of homework) { if (clientMap[h.client_email]) clientMap[h.client_email].homework.push(h); }
  for (const r of reports) { if (clientMap[r.client_email]) clientMap[r.client_email].reports.push(r); }
  for (const d of dogProfiles) { if (clientMap[d.client_email]) clientMap[d.client_email].dogs.push(d); }
  for (const l of behaviorLogs) { if (clientMap[l.client_email]) clientMap[l.client_email].logs.push(l); }

  const clients = Object.values(clientMap).filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.dogs.some(d => d.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingHWAll = homework.filter(h => !h.completed);
  const activeSchedules = schedules.filter(s => s.status === "active");

  if (selectedEmail) {
    const client = clientMap[selectedEmail];
    return (
      <ClientDetailPanel
        client={client}
        onBack={() => setSelectedEmail(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <SectionBadge>Trainer Hub</SectionBadge>
          <h1 className="font-heading text-3xl md:text-4xl mt-1">
            Client <span className="italic">Management</span>
          </h1>
          <p className="text-background/50 text-sm mt-1">Admin · {user.full_name}</p>
        </div>
        {/* Stats */}
        <div className="max-w-6xl mx-auto px-6 pb-6 grid grid-cols-4 gap-4">
          {[
            { label: "Active Clients", val: clients.length },
            { label: "Active Programs", val: activeSchedules.length },
            { label: "Pending Homework", val: pendingHWAll.length },
            { label: "Weekly Reports", val: reports.length },
          ].map(({ label, val }) => (
            <div key={label} className="bg-background/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-black">{val}</div>
              <div className="text-[10px] font-bold tracking-widest text-background/50 uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-all ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {id === "homework" && pendingHWAll.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingHWAll.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Program Templates Tab */}
        {tab === "programs" && (
          <ProgramBuilder />
        )}

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Programs */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-base">Active Programs</h2>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200">
                    {activeSchedules.length}
                  </span>
                </div>
                <ActiveProgramsPanel schedules={schedules} />
              </div>

              {/* Needs Attention */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-base">Needs Attention</h2>
                  {behaviorLogs.filter(l => {
                    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
                    return l.overall_mood === "very_rough" && l.log_date && new Date(l.log_date) >= cutoff;
                  }).length > 0 && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                      !
                    </span>
                  )}
                </div>
                <NeedsAttentionFeed
                  behaviorLogs={behaviorLogs}
                  onSelectClient={(email) => { setSelectedEmail(email); }}
                />
              </div>
            </div>

            {/* Quick Reply Inbox */}
            <div>
              <h2 className="font-bold text-base mb-4">Message Inbox</h2>
              <QuickReplyInbox />
            </div>
          </div>
        )}

        {/* Active Clients Tab */}
        {tab === "clients" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by email or dog name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            {loadingSched ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No active clients found.</div>
            ) : (
              <div className="space-y-3">
                {clients.map(c => (
                  <ClientRow key={c.email} client={c} onClick={() => setSelectedEmail(c.email)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedules Tab */}
        {tab === "schedules" && (
          <SchedulesView schedules={schedules} isLoading={loadingSched} />
        )}

        {/* Homework Tab */}
        {tab === "homework" && (
          <HomeworkApprovalView homework={homework} isLoading={loadingHW} />
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <div>
            <h2 className="font-bold text-lg mb-6">Weekly Report Studio</h2>
            <WeeklyReportStudio clients={clients} />
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div>
            <h2 className="font-bold text-lg mb-6">Business Analytics</h2>
            <AnalyticsDashboard
              schedules={schedules}
              homework={homework}
              behaviorLogs={behaviorLogs}
              reports={reports}
            />
          </div>
        )}

        {/* Billing Tab */}
        {tab === "billing" && (
          <div>
            <h2 className="font-bold text-lg mb-6">Billing & Invoices</h2>
            <BillingView
              schedules={schedules}
              clientEmails={clients.map(c => c.email)}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Inline sub-views (small enough to stay here) ───────────────────────────

function SchedulesView({ schedules, isLoading }) {
  const [filter, setFilter] = useState("active");
  const filtered = schedules.filter(s => filter === "all" || s.status === filter);

  const STATUS_COLOR = { active: "bg-green-100 text-green-700", completed: "bg-muted text-muted-foreground", paused: "bg-amber-100 text-amber-700" };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {["all", "active", "paused", "completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 capitalize transition-all ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>
      {isLoading ? <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border bg-muted/30">
                {["Client", "Dog", "Program", "Progress", "Dates", "Status"].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-primary tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{s.client_email}</td>
                  <td className="px-4 py-3 text-sm">{s.dog_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{s.program}</td>
                  <td className="px-4 py-3">
                    {s.sessions_total > 0 ? (
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((s.sessions_completed / s.sessions_total) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{s.sessions_completed}/{s.sessions_total}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.start_date && <div>Start: {s.start_date}</div>}
                    {s.end_date && <div>End: {s.end_date}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No schedules found.</div>}
        </div>
      )}
    </div>
  );
}

function HomeworkApprovalView({ homework, isLoading }) {
  const [filter, setFilter] = useState("pending");
  const filtered = filter === "pending" ? homework.filter(h => !h.completed) : filter === "done" ? homework.filter(h => h.completed) : homework;

  const DIFF_COLOR = { easy: "text-green-600 bg-green-50", medium: "text-amber-600 bg-amber-50", hard: "text-red-600 bg-red-50" };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[["pending", "Pending"], ["done", "Completed"], ["all", "All"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${filter === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {isLoading ? <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div> : (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No tasks found.</div>}
          {filtered.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.completed ? "bg-green-500" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{h.title}</div>
                <div className="text-xs text-muted-foreground">{h.client_email} {h.due_date && `· Due ${h.due_date}`}</div>
                {h.notes && <div className="text-xs italic text-muted-foreground mt-0.5">"{h.notes}"</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[h.difficulty] || "text-muted-foreground bg-muted"}`}>{h.difficulty}</span>
              {h.completed && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">✓ Done</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsView({ reports, isLoading }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading reports...</div>}
      {!isLoading && reports.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No weekly reports generated yet.</div>}
      {reports.map(r => (
        <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/40 transition-colors text-left"
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div>
              <div className="font-bold text-sm">{r.client_email} {r.dog_name && <span className="text-muted-foreground font-normal">· {r.dog_name}</span>}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Week of {r.week_start} · {r.total_logs} logs · {r.practice_days} practice days</div>
            </div>
            <div className="text-xs text-muted-foreground">{expanded === r.id ? "▲" : "▼"}</div>
          </button>
          {expanded === r.id && (
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
              {r.top_behaviors?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.top_behaviors.map(b => (
                    <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">{b}</span>
                  ))}
                </div>
              )}
              {r.ai_summary && (
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-xs font-bold text-primary mb-1">✨ AI Summary</div>
                  <p className="text-sm leading-relaxed">{r.ai_summary}</p>
                </div>
              )}
              <TrainerNotesEditor report={r} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TrainerNotesEditor({ report }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(report.trainer_notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.WeeklyReport.update(report.id, { trainer_notes: notes });
    qc.invalidateQueries({ queryKey: ["all-reports"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="text-xs font-bold text-secondary mb-1.5">Trainer Notes (visible to client)</div>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add preparation notes, observations, or next-session focus areas..."
        className="w-full min-h-[80px] text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full font-bold text-xs gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? "✓ Saved" : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}