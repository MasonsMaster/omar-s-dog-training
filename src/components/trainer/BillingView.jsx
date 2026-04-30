import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Mail, Receipt, Loader2, Check, X, DollarSign, AlertCircle, Clock } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-amber-100 text-amber-700 border-amber-200" },
  paid:     { label: "Paid",     color: "bg-green-100 text-green-700 border-green-200" },
  overdue:  { label: "Overdue",  color: "bg-red-100 text-red-700 border-red-200" },
  waived:   { label: "Waived",   color: "bg-muted text-muted-foreground border-border" },
};

function InvoiceStatusBadge({ invoice }) {
  // Auto-mark overdue if due_date passed and still pending
  const effectiveStatus =
    invoice.status === "pending" && invoice.due_date && isPast(parseISO(invoice.due_date))
      ? "overdue"
      : invoice.status;
  const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function AddInvoiceForm({ onCancel, onSaved, schedules, clientEmails }) {
  const [form, setForm] = useState({
    client_email: clientEmails[0] || "",
    program: "",
    dog_name: "",
    amount: "",
    due_date: "",
    notes: "",
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-fill program/dog when client changes
  const handleClientChange = (email) => {
    set("client_email", email);
    const sched = schedules.find(s => s.client_email === email && s.status === "active");
    if (sched) { set("program", sched.program || ""); set("dog_name", sched.dog_name || ""); }
  };

  const handleSave = async () => {
    if (!form.client_email || !form.amount) { toast.error("Client and amount are required."); return; }
    setSaving(true);
    const saved = await base44.entities.Invoice.create({ ...form, amount: Number(form.amount) });
    setSaving(false);
    toast.success("Invoice created!");
    onSaved(saved);
  };

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-4 mb-6">
      <h3 className="font-bold text-sm">New Invoice</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1">Client *</label>
          <select value={form.client_email} onChange={e => handleClientChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {clientEmails.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Amount (USD) *</label>
          <Input type="number" placeholder="399" value={form.amount} onChange={e => set("amount", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Program</label>
          <Input placeholder="e.g. Behavioral Program" value={form.program} onChange={e => set("program", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Dog Name</label>
          <Input placeholder="Optional" value={form.dog_name} onChange={e => set("dog_name", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Due Date</label>
          <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold block mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Additional details shown in the email..."
          className="w-full min-h-[60px] text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Create Invoice
        </Button>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, onStatusChange, onEmailSent }) {
  const [sendingType, setSendingType] = useState(null); // 'reminder' | 'receipt'
  const [editingStatus, setEditingStatus] = useState(false);
  const qc = useQueryClient();

  const effectiveStatus =
    invoice.status === "pending" && invoice.due_date && isPast(parseISO(invoice.due_date))
      ? "overdue"
      : invoice.status;

  const handleSendEmail = async (type) => {
    setSendingType(type);
    const res = await base44.functions.invoke("sendPaymentEmail", { invoiceId: invoice.id, type });
    setSendingType(null);
    if (res.data?.success) {
      toast.success(type === "reminder" ? "Reminder sent!" : "Receipt sent!");
      if (type === "reminder") qc.invalidateQueries({ queryKey: ["all-invoices"] });
      onEmailSent?.();
    } else {
      toast.error("Failed to send email.");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    const update = { status: newStatus };
    if (newStatus === "paid") update.paid_date = new Date().toISOString().split("T")[0];
    await base44.entities.Invoice.update(invoice.id, update);
    qc.invalidateQueries({ queryKey: ["all-invoices"] });
    setEditingStatus(false);
    toast.success("Invoice updated!");
    onStatusChange?.();
  };

  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">{invoice.client_email}</span>
          <InvoiceStatusBadge invoice={invoice} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
          {invoice.program && <span>{invoice.program}</span>}
          {invoice.dog_name && <span>🐾 {invoice.dog_name}</span>}
          {invoice.due_date && (
            <span className={`flex items-center gap-1 ${effectiveStatus === "overdue" ? "text-red-600 font-semibold" : ""}`}>
              <Clock className="w-3 h-3" /> Due {format(parseISO(invoice.due_date), "MMM d, yyyy")}
            </span>
          )}
          {invoice.paid_date && <span className="text-green-600">✓ Paid {format(parseISO(invoice.paid_date), "MMM d, yyyy")}</span>}
          {invoice.reminder_sent_at && (
            <span className="text-muted-foreground">Last reminder: {format(parseISO(invoice.reminder_sent_at), "MMM d")}</span>
          )}
        </div>
        {invoice.notes && <p className="text-xs text-muted-foreground mt-1 italic">{invoice.notes}</p>}
      </div>

      {/* Amount */}
      <div className="text-xl font-black text-primary shrink-0">${Number(invoice.amount).toFixed(2)}</div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {/* Status quick-change */}
        {editingStatus ? (
          <select autoFocus onChange={e => handleStatusUpdate(e.target.value)} onBlur={() => setEditingStatus(false)}
            defaultValue={invoice.status}
            className="h-8 text-xs rounded-md border border-input bg-transparent px-2">
            {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        ) : (
          <button onClick={() => setEditingStatus(true)}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors">
            Edit Status
          </button>
        )}

        {/* Send reminder (only for pending/overdue) */}
        {(effectiveStatus === "pending" || effectiveStatus === "overdue") && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-lg"
            onClick={() => handleSendEmail("reminder")} disabled={!!sendingType}>
            {sendingType === "reminder" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
            Remind
          </Button>
        )}

        {/* Send receipt (only for paid) */}
        {effectiveStatus === "paid" && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-lg"
            onClick={() => handleSendEmail("receipt")} disabled={!!sendingType}>
            {sendingType === "receipt" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
            Receipt
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BillingView({ schedules, clientEmails }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["all-invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 300),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["all-invoices"] });

  // Stats
  const outstanding = invoices.filter(i => i.status === "pending" || i.status === "overdue");
  const totalOutstanding = outstanding.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const overdueCount = invoices.filter(i =>
    i.status === "pending" && i.due_date && isPast(parseISO(i.due_date))
  ).length + invoices.filter(i => i.status === "overdue").length;

  const filtered = filterStatus === "all"
    ? invoices
    : filterStatus === "overdue"
      ? invoices.filter(i => i.status === "overdue" || (i.status === "pending" && i.due_date && isPast(parseISO(i.due_date))))
      : invoices.filter(i => i.status === filterStatus);

  return (
    <div>
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-2xl font-black text-foreground">${totalOutstanding.toFixed(0)}</div>
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Outstanding</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-2xl font-black text-green-600">${totalPaid.toFixed(0)}</div>
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Collected</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black text-red-600">{overdueCount}</div>
            {overdueCount > 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
          </div>
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Overdue</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-2xl font-black">{invoices.length}</div>
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Total Invoices</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "overdue", "paid", "waived"].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 capitalize transition-all ${
                filterStatus === f ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-muted-foreground"
              }`}>
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setAdding(a => !a)}
          variant={adding ? "outline" : "default"}
          className="rounded-full font-bold gap-2 shrink-0">
          {adding ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> New Invoice</>}
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <AddInvoiceForm
          schedules={schedules}
          clientEmails={clientEmails.length ? clientEmails : [""]}
          onCancel={() => setAdding(false)}
          onSaved={() => { setAdding(false); refresh(); }}
        />
      )}

      {/* Invoice list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading invoices...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No invoices yet</div>
          <p className="text-xs text-muted-foreground">Create your first invoice to start tracking payments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <InvoiceRow key={inv.id} invoice={inv} onStatusChange={refresh} onEmailSent={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}