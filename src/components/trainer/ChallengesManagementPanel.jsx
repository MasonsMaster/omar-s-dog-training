import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import ChallengeCard from "@/components/shared/ChallengeCard";
import ChallengeLogs from "@/components/shared/ChallengeLogs";

function ChallengeEditModal({ challenge, onSaved, onClose }) {
  const [status, setStatus] = useState(challenge.status);
  const [trend, setTrend] = useState(challenge.improvement_trend);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await base44.entities.BehaviorChallenge.update(challenge.id, {
        status,
        improvement_trend: trend,
      });
      qc.invalidateQueries({ queryKey: ["all-behavior-challenges"] });
      onSaved?.();
    } catch (error) {
      console.error("Update failed:", error);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl max-w-md w-full shadow-lg p-6 space-y-4">
        <h3 className="font-bold">{challenge.challenge_name}</h3>

        <div>
          <label className="text-xs font-semibold block mb-2">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-2">Improvement Trend</label>
          <select
            value={trend}
            onChange={e => setTrend(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="no_data">No Data</option>
            <option value="worsening">Worsening</option>
            <option value="stable">Stable</option>
            <option value="improving">Improving</option>
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full">
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={saving} className="rounded-full font-bold gap-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesManagementPanel({ clientEmails = [] }) {
  const [search, setSearch] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [editingChallenge, setEditingChallenge] = useState(null);

  const { data: allChallenges = [], isLoading } = useQuery({
    queryKey: ["all-behavior-challenges"],
    queryFn: () => base44.entities.BehaviorChallenge.list("-created_date", 200),
  });

  const filtered = allChallenges.filter(c =>
    !search || 
    c.challenge_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_email.toLowerCase().includes(search.toLowerCase()) ||
    c.dog_name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = filtered.filter(c => c.status === "active").length;
  const improvingCount = filtered.filter(c => c.improvement_trend === "improving").length;
  const needsAttention = filtered.filter(c => c.improvement_trend === "worsening" && c.status === "active").length;

  if (selectedChallenge) {
    return (
      <div>
        <button
          onClick={() => setSelectedChallenge(null)}
          className="text-sm text-primary font-semibold mb-4 flex items-center gap-1 hover:underline"
        >
          ← Back to All Challenges
        </button>
        <h2 className="font-bold text-lg mb-1">{selectedChallenge.challenge_name}</h2>
        <p className="text-sm text-muted-foreground mb-5">{selectedChallenge.client_email} • {selectedChallenge.dog_name}</p>
        <ChallengeLogs
          challenge={selectedChallenge}
          clientEmail={selectedChallenge.client_email}
          dogName={selectedChallenge.dog_name}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading challenges...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Challenges", val: activeCount },
          { label: "Improving", val: improvingCount },
          { label: "Needs Attention", val: needsAttention },
        ].map(({ label, val }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-black">{val}</div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by challenge, client, or dog..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Challenges grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No challenges found</div>
          <p className="text-xs text-muted-foreground">Clients will create challenges in their dashboard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {["active", "paused", "resolved"].map(status => {
            const grouped = filtered.filter(c => c.status === status);
            if (grouped.length === 0) return null;

            return (
              <div key={status}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 capitalize">
                  {status} ({grouped.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grouped.map(challenge => (
                    <div
                      key={challenge.id}
                      className="cursor-pointer hover:ring-2 ring-primary rounded-xl transition-all"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      <div className="relative">
                        <ChallengeCard
                          challenge={challenge}
                          onEdit={() => setEditingChallenge(challenge)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingChallenge && (
        <ChallengeEditModal
          challenge={editingChallenge}
          onSaved={() => setEditingChallenge(null)}
          onClose={() => setEditingChallenge(null)}
        />
      )}
    </div>
  );
}