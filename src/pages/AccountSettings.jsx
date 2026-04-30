import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionBadge from "@/components/shared/SectionBadge";
import { User, Dog, CreditCard, Check, Loader2, Plus, Trash2, AlertCircle, ShieldCheck, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

const TABS = [
  { id: "contact", label: "Contact Info", icon: User },
  { id: "dogs", label: "Dog Vaccinations", icon: Dog },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "danger", label: "Danger Zone", icon: AlertCircle },
];

const VACCINE_OPTIONS = ["Rabies", "DHPP", "Bordetella", "Leptospirosis", "Lyme", "Canine Influenza", "Other"];

// ── Contact Tab ──────────────────────────────────────────────────────────────

function ContactTab({ user }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    emergency_contact_name: user?.emergency_contact_name || "",
    emergency_contact_phone: user?.emergency_contact_phone || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    toast.success("Contact details updated!");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Full Name</label>
          <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Email</label>
          <Input value={user?.email || ""} disabled className="opacity-60 cursor-not-allowed" />
          <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed here.</p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Phone</label>
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(321) 555-0000" type="tel" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Address</label>
          <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Merritt Island, FL" />
        </div>
      </div>

      <div className="border-t border-border pt-5 space-y-4">
        <div className="text-sm font-bold">Emergency Contact</div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Name</label>
          <Input value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} placeholder="Emergency contact name" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Phone</label>
          <Input value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)} placeholder="(321) 555-0000" type="tel" />
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="rounded-full font-bold gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Save Changes
      </Button>
    </div>
  );
}

// ── Vaccination Tab ──────────────────────────────────────────────────────────

function VaccinationRow({ vax, onRemove }) {
  const expired = vax.expiry_date && isPast(new Date(vax.expiry_date + "T23:59:59"));
  const expiringSoon = vax.expiry_date && !expired &&
    new Date(vax.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${expired ? "border-red-200 bg-red-50" : expiringSoon ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
      <ShieldCheck className={`w-4 h-4 shrink-0 ${expired ? "text-red-500" : expiringSoon ? "text-amber-500" : "text-green-500"}`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{vax.name || "Unknown"}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
          {vax.date_given && <span>Given: {format(new Date(vax.date_given), "MMM d, yyyy")}</span>}
          {vax.expiry_date && (
            <span className={expired ? "text-red-600 font-semibold" : expiringSoon ? "text-amber-600 font-semibold" : ""}>
              {expired ? "⚠ Expired" : expiringSoon ? "⚠ Expires soon" : ""}: {format(new Date(vax.expiry_date), "MMM d, yyyy")}
            </span>
          )}
          {vax.vet_name && <span>· {vax.vet_name}</span>}
        </div>
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddVaxForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: "", date_given: "", expiry_date: "", vet_name: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.name) { toast.error("Vaccine name required"); return; }
    onAdd(form);
  };

  return (
    <div className="border-2 border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
      <div className="text-xs font-bold text-primary">Add Vaccination Record</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold block mb-1">Vaccine *</label>
          <select value={form.name} onChange={e => set("name", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select vaccine...</option>
            {VACCINE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {form.name === "Other" && (
            <Input className="mt-2" placeholder="Vaccine name" onChange={e => set("name", e.target.value)} value={form.name === "Other" ? "" : form.name} />
          )}
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Date Given</label>
          <Input type="date" value={form.date_given} onChange={e => set("date_given", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Expiry Date</label>
          <Input type="date" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold block mb-1">Vet / Clinic</label>
          <Input placeholder="e.g. Animal Wellness World" value={form.vet_name} onChange={e => set("vet_name", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="rounded-full font-bold gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="rounded-full">Cancel</Button>
      </div>
    </div>
  );
}

function DogsVaccinationTab({ clientEmail }) {
  const qc = useQueryClient();
  const [addingFor, setAddingFor] = useState(null); // dog id
  const [saving, setSaving] = useState(null);

  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ["dog-profiles", clientEmail],
    queryFn: () => base44.entities.DogProfile.filter({ client_email: clientEmail }),
    enabled: !!clientEmail,
  });

  const addVax = async (dogId, currentVax, newVax) => {
    setSaving(dogId);
    const updated = [...(currentVax || []), newVax];
    await base44.entities.DogProfile.update(dogId, { vaccinations: updated });
    qc.invalidateQueries({ queryKey: ["dog-profiles", clientEmail] });
    setSaving(null);
    setAddingFor(null);
    toast.success("Vaccination record added!");
  };

  const removeVax = async (dogId, currentVax, index) => {
    const updated = currentVax.filter((_, i) => i !== index);
    await base44.entities.DogProfile.update(dogId, { vaccinations: updated });
    qc.invalidateQueries({ queryKey: ["dog-profiles", clientEmail] });
    toast.success("Record removed.");
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;

  if (dogs.length === 0) return (
    <div className="text-center py-16 bg-card border border-border rounded-2xl">
      <Dog className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <div className="font-bold text-sm mb-1">No dog profiles yet</div>
      <p className="text-xs text-muted-foreground mb-4">Add your dog profile in the My Portal to manage vaccinations.</p>
      <a href="/my-dashboard"><Button size="sm" className="rounded-full font-bold">Go to My Portal</Button></a>
    </div>
  );

  return (
    <div className="space-y-8">
      {dogs.map(dog => {
        const vax = dog.vaccinations || [];
        const hasExpired = vax.some(v => v.expiry_date && isPast(new Date(v.expiry_date + "T23:59:59")));
        return (
          <div key={dog.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dog.photo_url
                  ? <img src={dog.photo_url} alt={dog.name} className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Dog className="w-5 h-5 text-primary/40" /></div>
                }
                <div>
                  <div className="font-bold">{dog.name}</div>
                  <div className="text-xs text-muted-foreground">{[dog.breed, dog.age_years && `${dog.age_years} yrs`].filter(Boolean).join(" · ")}</div>
                </div>
                {hasExpired && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Expired vaccines
                  </span>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddingFor(dog.id)} className="rounded-full gap-1.5 font-bold">
                <Plus className="w-3.5 h-3.5" /> Add Record
              </Button>
            </div>

            {addingFor === dog.id && (
              <AddVaxForm
                onAdd={(newVax) => addVax(dog.id, vax, newVax)}
                onCancel={() => setAddingFor(null)}
              />
            )}

            {vax.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">No vaccination records yet — add your first one above.</div>
            ) : (
              <div className="space-y-2">
                {vax.map((v, i) => (
                  <VaccinationRow key={i} vax={v} onRemove={() => removeVax(dog.id, vax, i)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Subscription Tab ─────────────────────────────────────────────────────────

function SubscriptionTab({ user }) {
  const { data: schedules = [] } = useQuery({
    queryKey: ["client-schedules", user?.email],
    queryFn: () => base44.entities.TrainingSchedule.filter({ client_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["client-invoices", user?.email],
    queryFn: () => base44.entities.Invoice.filter({ client_email: user?.email }),
    enabled: !!user?.email,
  });

  const activePrograms = schedules.filter(s => s.status === "active");
  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "overdue");
  const paidInvoices = invoices.filter(i => i.status === "paid");

  const STATUS_COLOR = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    waived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8">
      {/* Active programs */}
      <div>
        <div className="text-sm font-bold mb-3">Active Training Programs</div>
        {activePrograms.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">No active programs. <a href="/apply" className="text-primary font-semibold hover:underline">Apply to enroll →</a></div>
        ) : (
          <div className="space-y-3">
            {activePrograms.map(s => {
              const pct = s.sessions_total ? Math.round((s.sessions_completed / s.sessions_total) * 100) : 0;
              return (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">{s.program}</div>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                  </div>
                  {s.dog_name && <div className="text-xs text-muted-foreground mb-2">🐾 {s.dog_name}</div>}
                  {s.sessions_total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Sessions</span><span className="text-primary">{s.sessions_completed}/{s.sessions_total}</span>
                      </div>
                      <div className="bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  {s.end_date && <div className="text-xs text-muted-foreground mt-2">Ends: {format(new Date(s.end_date), "MMMM d, yyyy")}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <div className="text-sm font-bold mb-3">Billing History</div>
        {invoices.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">No invoices on file yet.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-muted/30">
                  {["Program", "Dog", "Amount", "Due Date", "Status"].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-primary tracking-widest px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{inv.program || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.dog_name || "—"}</td>
                    <td className="px-4 py-3 font-bold text-primary">${inv.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLOR[inv.status] || ""}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pendingInvoices.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {pendingInvoices.length} outstanding invoice{pendingInvoices.length > 1 ? "s" : ""}. Contact Omar to arrange payment: <a href="tel:3218306272" className="font-bold hover:underline">(321) 830-6272</a>
          </div>
        )}
      </div>

      {/* Manage subscription CTA */}
      <div className="bg-foreground text-background rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-bold mb-1">Need to change your plan?</div>
          <p className="text-background/60 text-sm">Contact Omar directly to pause, upgrade, or cancel your training program.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="tel:3218306272">
            <Button size="sm" variant="outline" className="rounded-full border-background/30 text-background hover:bg-background/10 font-bold">📞 Call</Button>
          </a>
          <a href="mailto:info@omarsdogtraining.com">
            <Button size="sm" className="rounded-full bg-primary font-bold">✉ Email</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AccountSettings() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const [tab, setTab] = useState("contact");

  if (isLoadingAuth) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!isAuthenticated || !user) return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="font-heading text-2xl mb-2">Sign In Required</h2>
      <p className="text-muted-foreground text-sm mb-6">Please log in to manage your account settings.</p>
      <Button onClick={navigateToLogin} size="lg" className="rounded-full font-bold px-10">Log In</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <SectionBadge>My Account</SectionBadge>
          <h1 className="font-heading text-3xl md:text-4xl mt-1">
            Account <span className="italic">Settings</span>
          </h1>
          <p className="text-background/50 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-3xl mx-auto px-6 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-all ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {tab === "contact" && <ContactTab user={user} />}
        {tab === "dogs" && <DogsVaccinationTab clientEmail={user.email} />}
        {tab === "subscription" && <SubscriptionTab user={user} />}
        {tab === "danger" && <DangerZoneTab user={user} />}
      </div>
    </div>
  );
}

// ── Danger Zone Tab ──────────────────────────────────────────────────────────

function DangerZoneTab({ user }) {
  const { logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      toast.error("Please type the exact text to confirm.");
      return;
    }

    setDeleting(true);
    try {
      // Call a backend function to delete the account
      await base44.functions.invoke("deleteUserAccount", { email: user.email });
      toast.success("Account deleted. Logging out...");
      setTimeout(() => logout(), 1500);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete account. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-destructive">Delete Account</div>
            <p className="text-sm text-foreground/70 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-full font-bold gap-2 w-full"
        >
          <Trash2 className="w-4 h-4" /> Delete Account
        </Button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl max-w-sm w-full shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
              <div>
                <h3 className="font-bold">Delete Account?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently delete your account, all dog profiles, training schedules, and behavior logs. This cannot be reversed.
                </p>
              </div>
            </div>

            <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-2">Type this exactly to confirm:</p>
              <p className="text-sm font-mono font-bold text-destructive mb-3">DELETE MY ACCOUNT</p>
              <Input
                type="text"
                placeholder="Type confirmation text..."
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                disabled={deleting}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== "DELETE MY ACCOUNT"}
                className="rounded-full font-bold gap-1"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}