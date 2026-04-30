import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquare, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function ClientThread({ clientEmail, messages, isSelected, onClick, unreadCount }) {
  const latest = messages[messages.length - 1];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : unreadCount > 0
          ? "border-amber-300 bg-amber-50 hover:border-amber-400"
          : "border-border hover:border-primary/40 hover:bg-accent/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${unreadCount > 0 ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
          <span className="font-semibold text-sm truncate">{clientEmail}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      {latest && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate pl-4">
          {latest.is_trainer ? "You: " : ""}{latest.body}
        </p>
      )}
      {latest?.created_date && (
        <p className="text-[10px] text-muted-foreground mt-0.5 pl-4">
          {formatDistanceToNow(new Date(latest.created_date), { addSuffix: true })}
        </p>
      )}
    </button>
  );
}

function MessageBubble({ msg }) {
  const isOwn = msg.is_trainer;
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isOwn
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-card border border-border rounded-bl-sm"
      }`}>
        {!isOwn && (
          <div className="text-[10px] font-bold text-secondary mb-1 uppercase tracking-widest">
            {msg.sender_name || "Client"}
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 px-1">
        {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ""}
        {!isOwn && !msg.read_by_trainer && (
          <span className="ml-2 font-bold text-primary">● New</span>
        )}
      </div>
    </div>
  );
}

export default function QuickReplyInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedClient, setSelectedClient] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ["all-messages-inbox"],
    queryFn: () => base44.entities.Message.list("-created_date", 500),
    refetchInterval: 20000,
  });

  // Group by client, sorted by latest message
  const clientThreads = Object.values(
    allMessages.reduce((acc, msg) => {
      const key = msg.client_email;
      if (!key) return acc;
      if (!acc[key]) acc[key] = { email: key, messages: [], unread: 0 };
      acc[key].messages.push(msg);
      if (!msg.is_trainer && !msg.read_by_trainer) acc[key].unread++;
      return acc;
    }, {})
  )
    .map(t => ({ ...t, messages: t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) }))
    .sort((a, b) => {
      const aLast = new Date(a.messages[a.messages.length - 1]?.created_date || 0);
      const bLast = new Date(b.messages[b.messages.length - 1]?.created_date || 0);
      return bLast - aLast;
    });

  const selectedThread = clientThreads.find(t => t.email === selectedClient);
  const threadMessages = selectedThread?.messages || [];

  // Mark as read when selected
  useEffect(() => {
    if (!selectedClient || !threadMessages.length) return;
    const unread = threadMessages.filter(m => !m.is_trainer && !m.read_by_trainer);
    for (const m of unread) {
      base44.entities.Message.update(m.id, { read_by_trainer: true });
    }
    qc.invalidateQueries({ queryKey: ["all-messages-inbox"] });
  }, [selectedClient, threadMessages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length]);

  const send = async () => {
    if (!body.trim() || !selectedClient) return;
    setSending(true);
    await base44.entities.Message.create({
      client_email: selectedClient,
      sender_email: user.email,
      sender_name: user.full_name || "Omar",
      is_trainer: true,
      body: body.trim(),
      read_by_trainer: true,
      read_by_client: false,
    });
    setBody("");
    qc.invalidateQueries({ queryKey: ["all-messages-inbox"] });
    setSending(false);
    toast.success("Sent!");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
  };

  const totalUnread = clientThreads.reduce((sum, t) => sum + t.unread, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
      </div>
    );
  }

  if (clientThreads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
        <div className="font-bold text-sm mb-1">No messages yet</div>
        <p className="text-xs text-muted-foreground">Client messages will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[520px]">
      {/* Thread list */}
      <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
        {totalUnread > 0 && (
          <div className="text-xs font-bold text-primary mb-1">
            {totalUnread} unread message{totalUnread > 1 ? "s" : ""}
          </div>
        )}
        {clientThreads.map(t => (
          <ClientThread
            key={t.email}
            clientEmail={t.email}
            messages={t.messages}
            isSelected={selectedClient === t.email}
            onClick={() => setSelectedClient(t.email)}
            unreadCount={t.unread}
          />
        ))}
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden min-w-0">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <div className="font-bold text-sm mb-1">Select a conversation</div>
            <p className="text-xs text-muted-foreground">Pick a client from the list to view and reply.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">{selectedClient}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {threadMessages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-3 bg-background">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply... (Ctrl+Enter to send)"
                  className="min-h-[60px] max-h-[100px] resize-none text-sm flex-1"
                />
                <Button
                  onClick={send}
                  disabled={sending || !body.trim()}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Ctrl+Enter to send</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}