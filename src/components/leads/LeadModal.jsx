import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Mail, Phone, Shield } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Archived" },
];

export default function LeadModal({ lead, onClose, onSave, onEmail }) {
  const [form, setForm] = useState({ ...lead });
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-bold text-lg">{form.first_name} {form.last_name}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5" onClick={() => onEmail(form)} disabled={!form.email}>
              <Mail className="w-3.5 h-3.5" /> Send Follow-Up Email
            </Button>
            {form.phone && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(`tel:${form.phone}`)}>
                <Phone className="w-3.5 h-3.5" /> Call {form.phone}
              </Button>
            )}
            {form.phone && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(`sms:${form.phone}`)}>
                💬 Text
              </Button>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update("status", value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    form.status === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Contact Info</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
                <Input value={form.first_name || ""} onChange={(e) => update("first_name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
                <Input value={form.last_name || ""} onChange={(e) => update("last_name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <Input value={form.location || ""} onChange={(e) => update("location", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Source</label>
                <Input value={form.source || ""} onChange={(e) => update("source", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dog Info */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Dog Info</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dog's Name</label>
                <Input value={form.dog_name || ""} onChange={(e) => update("dog_name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Breed</label>
                <Input value={form.breed || ""} onChange={(e) => update("breed", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Situation */}
          {form.situation && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Situation</label>
              <div className="bg-muted rounded-lg p-4 text-sm leading-relaxed">{form.situation}</div>
            </div>
          )}

          {/* Services */}
          {(form.services_interested || []).length > 0 && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Services Interested</label>
              <div className="flex flex-wrap gap-2">
                {form.services_interested.map((s) => (
                  <span key={s} className="text-xs bg-primary/5 text-primary border border-primary/15 rounded-full px-3 py-1 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-3 flex-wrap">
            {form.is_military && (
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary rounded-lg px-4 py-2 text-sm font-semibold">
                <Shield className="w-4 h-4" /> Military / First Responder — 15% off
              </div>
            )}
            {form.urgency && (
              <div className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                form.urgency === "ASAP" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"
              }`}>
                ⚡ Urgency: {form.urgency}
              </div>
            )}
            {form.payment_preference && (
              <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">
                💳 {form.payment_preference}
              </div>
            )}
            {form.promo_code && (
              <div className="bg-primary/5 text-primary border border-primary/15 rounded-lg px-4 py-2 text-sm font-mono font-bold">
                🎟 {form.promo_code}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Notes</label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Add notes about this lead..."
              className="min-h-[80px]"
            />
          </div>

          {/* Submitted date */}
          {lead.created_date && (
            <p className="text-xs text-muted-foreground">
              Submitted {format(new Date(lead.created_date), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(lead.id, form)} className="font-bold">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}