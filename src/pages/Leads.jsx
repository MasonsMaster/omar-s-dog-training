import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SectionBadge from "@/components/shared/SectionBadge";
import LeadModal from "@/components/leads/LeadModal";
import { Search, Mail, Phone, RefreshCw, Users, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  new:       { label: "New",       color: "bg-blue-100 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  booked:    { label: "Booked",    color: "bg-green-100 text-green-700 border-green-200" },
  completed: { label: "Archived",  color: "bg-muted text-muted-foreground border-border" },
};

const FILTERS = ["all", "new", "contacted", "booked", "completed"];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const filtered = leads.filter((l) => {
    const matchFilter = filter === "all" || l.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${l.first_name} ${l.last_name} ${l.email} ${l.dog_name} ${l.breed} ${l.phone}`
        .toLowerCase()
        .includes(q);
    return matchFilter && matchSearch;
  });

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? leads.length : leads.filter((l) => l.status === f).length;
    return acc;
  }, {});

  const sendFollowUp = (lead) => {
    const subject = encodeURIComponent(`Following up — Omar's Dog Training™`);
    const body = encodeURIComponent(
      `Hi ${lead.first_name},\n\nThank you for reaching out to Omar's Dog Training™! I wanted to personally follow up about ${lead.dog_name ? `you and ${lead.dog_name}` : "your inquiry"}.\n\nI'd love to chat and find the best solution for you. Feel free to call or text me directly at (321) 830-6272, or reply to this email.\n\nLooking forward to connecting!\n\n— Omar\nOmar's Dog Training™\n📞 (321) 830-6272\n🌐 omarsdogtraining.com`
    );
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
    updateLead.mutate({ id: lead.id, data: { status: "contacted" } });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <SectionBadge>Admin</SectionBadge>
          <h1 className="font-heading text-3xl md:text-4xl">
            Lead <span className="italic text-primary">Management</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["leads"] })}
          className="gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <Users className="w-6 h-6 text-foreground" />
          <div><div className="text-2xl font-black">{counts.all}</div><div className="text-xs text-muted-foreground font-semibold">Total Leads</div></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-blue-600" />
          <div><div className="text-2xl font-black">{counts.new}</div><div className="text-xs text-muted-foreground font-semibold">New</div></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <Mail className="w-6 h-6 text-amber-600" />
          <div><div className="text-2xl font-black">{counts.contacted}</div><div className="text-xs text-muted-foreground font-semibold">Contacted</div></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div><div className="text-2xl font-black">{counts.booked}</div><div className="text-xs text-muted-foreground font-semibold">Booked</div></div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, dog, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all capitalize ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              {f === "completed" ? "Archived" : f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Lead Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border bg-muted/30">
                  {["Client", "Dog", "Services", "Location", "Urgency", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-black text-primary tracking-widest px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm">{lead.first_name} {lead.last_name}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-muted-foreground">{lead.phone}</div>}
                      {lead.is_military && (
                        <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          🎖️ Military
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {lead.dog_name && <div className="font-semibold">{lead.dog_name}</div>}
                      {lead.breed && <div className="text-xs text-muted-foreground">{lead.breed}</div>}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {(lead.services_interested || []).slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] bg-primary/5 text-primary border border-primary/10 rounded px-2 py-0.5 font-medium whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {(lead.services_interested || []).length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{lead.services_interested.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{lead.location || "—"}</td>
                    <td className="px-4 py-3">
                      {lead.urgency && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          lead.urgency === "ASAP"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {lead.urgency}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status || "new"}
                        onChange={(e) => updateLead.mutate({ id: lead.id, data: { status: e.target.value } })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border cursor-pointer ${
                          STATUS_CONFIG[lead.status]?.color || STATUS_CONFIG.new.color
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="booked">Booked</option>
                        <option value="completed">Archived</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {lead.created_date ? format(new Date(lead.created_date), "MMM d, yy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs gap-1"
                          onClick={() => sendFollowUp(lead)}
                          disabled={!lead.email}
                          title="Send follow-up email"
                        >
                          <Mail className="w-3 h-3" /> Email
                        </Button>
                        {lead.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs gap-1"
                            onClick={() => window.open(`tel:${lead.phone}`)}
                            title="Call"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => setSelectedLead(lead)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={(id, data) => {
            updateLead.mutate({ id, data });
            setSelectedLead(null);
          }}
          onEmail={sendFollowUp}
        />
      )}
    </div>
  );
}