import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ChallengeCard from "@/components/shared/ChallengeCard";
import ChallengeLogs from "@/components/shared/ChallengeLogs";

function CreateChallengeForm({ clientEmail, dogNames, onCreated, onCancel }) {
  const [form, setForm] = useState({
    client_email: clientEmail,
    dog_name: dogNames[0] || "",
    challenge_name: "",
    description: "",
    target_goal: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.challenge_name.trim()) {
      toast.error("Challenge name required");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BehaviorChallenge.create(form);
      toast.success("Challenge created!");
      setSaving(false);
      onCreated();
    } catch (error) {
      toast.error("Failed to create challenge");
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-sm">Create Behavior Challenge</h3>

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

      <Input
        placeholder="Challenge name (e.g., Leash Reactivity)"
        value={form.challenge_name}
        onChange={e => set("challenge_name", e.target.value)}
      />

      <Textarea
        placeholder="Describe the challenge in detail..."
        value={form.description}
        onChange={e => set("description", e.target.value)}
        className="min-h-[80px]"
      />

      <Textarea
        placeholder="What success looks like (goal)..."
        value={form.target_goal}
        onChange={e => set("target_goal", e.target.value)}
        className="min-h-[60px]"
      />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Create
        </Button>
      </div>
    </div>
  );
}

export default function BehaviorChallengesPanel({ clientEmail, dogProfiles = [] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const qKey = ["behavior-challenges", clientEmail];
  const qc = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.BehaviorChallenge.filter({ client_email: clientEmail }, "-created_date", 50),
  });

  const dogNames = dogProfiles.map(p => p.name).filter(Boolean);
  const activeChallenges = challenges.filter(c => c.status === "active");

  if (selectedChallenge) {
    return (
      <div>
        <button
          onClick={() => setSelectedChallenge(null)}
          className="text-sm text-primary font-semibold mb-4 flex items-center gap-1 hover:underline"
        >
          ← Back to Challenges
        </button>
        <h2 className="font-bold text-lg mb-4">{selectedChallenge.challenge_name}</h2>
        <ChallengeLogs
          challenge={selectedChallenge}
          clientEmail={clientEmail}
          dogName={selectedChallenge.dog_name}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-bold text-lg">Behavior Challenges</h2>
          <p className="text-sm text-muted-foreground">Track specific challenges and monitor improvement</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          variant={showCreate ? "outline" : "default"}
          className="rounded-full font-bold gap-2"
        >
          {showCreate ? "Cancel" : <><Plus className="w-3.5 h-3.5" /> New Challenge</>}
        </Button>
      </div>

      {showCreate && (
        <CreateChallengeForm
          clientEmail={clientEmail}
          dogNames={dogNames}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: qKey });
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading challenges...
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="font-bold text-sm mb-1">No challenges yet</div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
            Create a challenge to start tracking specific behaviors and improvements.
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full gap-2">
            <Plus className="w-3.5 h-3.5" /> Create Challenge
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeChallenges.length > 0 && (
            <div>
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Active ({activeChallenges.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeChallenges.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChallenge(c)}
                    className="text-left hover:ring-2 ring-primary rounded-xl transition-all"
                  >
                    <ChallengeCard challenge={c} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {challenges.filter(c => c.status !== "active").length > 0 && (
            <div className="opacity-60">
              <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                Other ({challenges.filter(c => c.status !== "active").length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challenges.filter(c => c.status !== "active").map(c => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}