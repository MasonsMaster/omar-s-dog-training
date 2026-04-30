import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Send, Pencil, Check, X, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Dog, BarChart2, Mail
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

const MOOD_COLOR = {
  great: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  neutral: "bg-yellow-100 text-yellow-700",
  rough: "bg-orange-100 text-orange-700",
  very_rough: "bg-red-100 text-red-700",
};

function WeekSelector({ value, onChange }) {
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const mon = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const sun = endOfWeek(mon, { weekStartsOn: 1 });
    weeks.push({
      start: format(mon, "yyyy-MM-dd"),
      end: format(sun, "yyyy-MM-dd"),
      label: `${format(mon, "MMM d")} – ${format(sun, "MMM d, yyyy")}`,
    });
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
      {weeks.map(w => (
        <option key={w.start} value={w.start}>{w.label}</option>
      ))}
    </select>
  );
}

function ReportCard({ report, onRefresh }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [aiDraft, setAiDraft] = useState(report.ai_summary || "");
  const [trainerNotes, setTrainerNotes] = useState(report.trainer_notes || "");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.WeeklyReport.update(report.id, {
      ai_summary: aiDraft,
      trainer_notes: trainerNotes,
    });
    qc.invalidateQueries({ queryKey: ["all-reports"] });
    setSaving(false);
    setEditing(false);
    toast.success("Report saved!");
  };

  const sendEmail = async () => {
    setSending(true);
    const res = await base44.functions.invoke("sendWeeklyReportEmail", { report_id: report.id });
    setSending(false);
    if (res.data?.success) {
      setSent(true);
      toast.success(`Report emailed to ${report.client_email}`);
    } else {
      toast.error(res.data?.error || "Failed to send email.");
    }
  };

  const moodEntries = report.mood_breakdown ? Object.entries(report.mood_breakdown) : [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Dog className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">
              {report.dog_name || report.client_email}
              {report.dog_name && <span className="text-muted-foreground font-normal ml-1 text-xs">· {report.client_email}</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {report.total_logs} logs · {report.practice_days} practice days · {report.total_practice_minutes} min
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {sent && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">✓ Sent</span>}
          {report.trainer_notes && <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">Notes added</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 py-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Logs", val: report.total_logs },
              { label: "Practice Days", val: report.practice_days },
              { label: "Minutes", val: report.total_practice_minutes },
            ].map(({ label, val }) => (
              <div key={label} className="bg-muted rounded-xl p-3 text-center">
                <div className="text-xl font-black text-primary">{val || 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Mood breakdown */}
          {moodEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {moodEntries.map(([mood, count]) => (
                <span key={mood} className={`text-xs font-bold px-2.5 py-1 rounded-full ${MOOD_COLOR[mood] || "bg-muted text-muted-foreground"}`}>
                  {mood.replace("_", " ")} ({count})
                </span>
              ))}
            </div>
          )}

          {/* Top behaviors */}
          {report.top_behaviors?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.top_behaviors.map(b => (
                <span key={b} className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-full">{b}</span>
              ))}
            </div>
          )}

          {/* AI Summary — editable */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI-Generated Summary
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editing ? (
              <textarea
                value={aiDraft}
                onChange={e => setAiDraft(e.target.value)}
                className="w-full min-h-[100px] text-sm rounded-lg border border-primary/40 bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ) : (
              <div className="bg-green-50 border-l-4 border-green-400 rounded-r-xl px-4 py-3 text-sm leading-relaxed text-foreground">
                {aiDraft || <span className="text-muted-foreground italic">No AI summary yet.</span>}
              </div>
            )}
          </div>

          {/* Trainer notes */}
          <div>
            <div className="text-xs font-bold text-secondary mb-2">Your Notes to Client</div>
            <textarea
              value={trainerNotes}
              onChange={e => { setTrainerNotes(e.target.value); setEditing(true); }}
              placeholder="Add personal observations, next session focus, encouragement..."
              className="w-full min-h-[72px] text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              {editing && (
                <>
                  <Button size="sm" onClick={save} disabled={saving} className="rounded-full font-bold gap-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setAiDraft(report.ai_summary || ""); setTrainerNotes(report.trainer_notes || ""); }} className="rounded-full gap-1.5">
                    <X className="w-3.5 h-3.5" /> Discard
                  </Button>
                </>
              )}
            </div>
            <Button size="sm" onClick={sendEmail} disabled={sending}
              className="rounded-full font-bold gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              {sending ? "Sending..." : "Email to Client"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeeklyReportStudio({ clients }) {
  const qc = useQueryClient();

  // Default to last week's Monday
  const lastMon = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [weekStart, setWeekStart] = useState(lastMon);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  const weekEnd = format(endOfWeek(new Date(weekStart), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ["all-reports"],
    queryFn: () => base44.entities.WeeklyReport.list("-week_start", 200),
  });

  const filtered = reports.filter(r =>
    r.week_start === weekStart &&
    (!search || r.client_email?.includes(search) || r.dog_name?.toLowerCase().includes(search.toLowerCase()))
  );

  // Clients with logs this week but no report yet
  const reportedEmails = new Set(filtered.map(r => r.client_email));
  const missingClients = clients.filter(c => !reportedEmails.has(c.email) && c.logs.length > 0);

  const generateAll = async () => {
    setGenerating(true);
    let count = 0;
    for (const client of missingClients) {
      const dogs = [...new Set(client.logs.map(l => l.dog_name).filter(Boolean))];
      const targets = dogs.length > 0 ? dogs : [null];
      for (const dog of targets) {
        const res = await base44.functions.invoke("generateReportOnDemand", {
          client_email: client.email,
          dog_name: dog || undefined,
          week_start: weekStart,
          week_end: weekEnd,
        });
        if (res.data?.success) count++;
      }
    }
    await refetch();
    setGenerating(false);
    toast.success(`Generated ${count} report(s) for week of ${weekStart}.`);
  };

  const generateSingle = async (client) => {
    const dogs = [...new Set(client.logs.map(l => l.dog_name).filter(Boolean))];
    const targets = dogs.length > 0 ? dogs : [null];
    for (const dog of targets) {
      await base44.functions.invoke("generateReportOnDemand", {
        client_email: client.email,
        dog_name: dog || undefined,
        week_start: weekStart,
        week_end: weekEnd,
      });
    }
    await refetch();
    toast.success(`Report generated for ${client.email}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Week</label>
            <WeekSelector value={weekStart} onChange={setWeekStart} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Search</label>
            <Input placeholder="Email or dog name..." value={search} onChange={e => setSearch(e.target.value)} className="w-52" />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {missingClients.length > 0 && (
            <Button size="sm" onClick={generateAll} disabled={generating} className="rounded-full font-bold gap-1.5">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? "Generating..." : `Generate ${missingClients.length} Missing`}
            </Button>
          )}
        </div>
      </div>

      {/* Missing clients alert */}
      {missingClients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-bold text-amber-800 mb-2">
            {missingClients.length} client{missingClients.length > 1 ? "s" : ""} with logs but no report yet this week:
          </div>
          <div className="flex flex-wrap gap-2">
            {missingClients.map(c => (
              <button key={c.email} onClick={() => generateSingle(c)}
                className="text-xs font-semibold bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> {c.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reports list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No reports for this week</div>
          <p className="text-xs text-muted-foreground mb-4">
            {missingClients.length > 0
              ? "Click \"Generate Missing\" above to create AI reports from behavior logs."
              : "No behavior logs found for this week."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {filtered.length} report{filtered.length !== 1 ? "s" : ""} — week of {weekStart}
          </div>
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} onRefresh={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}