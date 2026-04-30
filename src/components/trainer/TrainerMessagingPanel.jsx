import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquare, Link2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const MOOD_EMOJI = { great: "🌟", good: "😊", neutral: "😐", rough: "😔", very_rough: "😣" };

function ThreadSelector({ schedules, logs, selectedThread, onSelect }) {
  const [open, setOpen] = useState(false);
  const label = !selectedThread ? "General"
    : selectedThread.type === "schedule" ? selectedThread.program
    : `Log: ${selectedThread.date} ${selectedThread.mood ? MOOD_EMOJI[selectedThread.mood] : ""}`;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors">
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-xl shadow-lg min-w-[240px] max-h-64 overflow-y-auto">
          <div className="p-1">
            <button onClick={() => { onSelect(null); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors ${!selectedThread ? "font-bold text-primary" : ""}`}>
              💬 General
            </button>
            {schedules.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Programs</div>
                {schedules.map(s => (
                  <button key={s.id} onClick={() => { onSelect({ type: "schedule", id: s.id, program: s.program }); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors truncate ${selectedThread?.id === s.id ? "font-bold text-primary" : ""}`}>
                    📋 {s.program}
                  </button>
                ))}
              </>
            )}
            {logs.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Behavior Logs</div>
                {logs.slice(0, 10).map(l => (
                  <button key={l.id} onClick={() => { onSelect({ type: "log", id: l.id, date: l.log_date, mood: l.overall_mood }); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors ${selectedThread?.id === l.id ? "font-bold text-primary" : ""}`}>
                    {l.overall_mood ? MOOD_EMOJI[l.overall_mood] : "📝"} {l.log_date}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, trainerEmail }) {
  const isOwn = msg.is_trainer;
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
      }`}>
        {!isOwn && (
          <div className="text-[10px] font-bold text-secondary mb-1 uppercase tracking-widest">
            {msg.sender_name || "Client"}
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 px-1">
        {msg.created_date ? format(new Date(msg.created_date), "MMM d, h:mm a") : ""}
        {!isOwn && !msg.read_by_trainer && <span className="ml-2 font-bold text-primary">● New</span>}
      </div>
    </div>
  );
}

export default function TrainerMessagingPanel({ clientEmail, schedules = [], logs = [] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedThread, setSelectedThread] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const threadKey = selectedThread?.id || "general";

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["trainer-messages", clientEmail, threadKey],
    queryFn: async () => {
      const all = await base44.entities.Message.filter({ client_email: clientEmail });
      if (!selectedThread) return all.filter(m => !m.schedule_id && !m.log_id);
      if (selectedThread.type === "schedule") return all.filter(m => m.schedule_id === selectedThread.id);
      if (selectedThread.type === "log") return all.filter(m => m.log_id === selectedThread.id);
      return [];
    },
    enabled: !!clientEmail,
    refetchInterval: 20000,
  });

  const unreadCount = messages.filter(m => !m.is_trainer && !m.read_by_trainer).length;

  // Mark client messages as read
  useEffect(() => {
    const unread = messages.filter(m => !m.is_trainer && !m.read_by_trainer);
    for (const m of unread) {
      base44.entities.Message.update(m.id, { read_by_trainer: true });
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    await base44.entities.Message.create({
      client_email: clientEmail,
      sender_email: user.email,
      sender_name: user.full_name || "Omar",
      is_trainer: true,
      body: body.trim(),
      schedule_id: selectedThread?.type === "schedule" ? selectedThread.id : undefined,
      log_id: selectedThread?.type === "log" ? selectedThread.id : undefined,
      log_date: selectedThread?.type === "log" ? selectedThread.date : undefined,
      read_by_trainer: true,
      read_by_client: false,
    });
    setBody("");
    qc.invalidateQueries({ queryKey: ["trainer-messages", clientEmail, threadKey] });
    setSending(false);
    toast.success("Message sent to client!");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
  };

  return (
    <div className="flex flex-col h-[560px] bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Conversation with {clientEmail}</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <ThreadSelector schedules={schedules} logs={logs} selectedThread={selectedThread} onSelect={setSelectedThread} />
      </div>

      {selectedThread && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs text-primary font-semibold flex items-center gap-1.5">
          <Link2 className="w-3 h-3" />
          {selectedThread.type === "schedule" && `Thread: ${selectedThread.program}`}
          {selectedThread.type === "log" && `About log: ${selectedThread.date} ${selectedThread.mood ? MOOD_EMOJI[selectedThread.mood] : ""}`}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <div className="font-bold text-sm mb-1">No messages yet</div>
            <p className="text-xs text-muted-foreground">Start the conversation or wait for the client to reach out.</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea value={body} onChange={e => setBody(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Reply to client... (Ctrl+Enter to send)" className="min-h-[60px] max-h-[120px] resize-none text-sm flex-1" />
          <Button onClick={send} disabled={sending || !body.trim()} size="icon" className="h-10 w-10 shrink-0 rounded-xl">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}