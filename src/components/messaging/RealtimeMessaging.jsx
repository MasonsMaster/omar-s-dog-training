import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquare, Clock, AlertCircle, Check, CheckCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

function MessageBubble({ msg, isOwn, showReadStatus }) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border rounded-bl-sm"
        }`}
      >
        {!isOwn && msg.sender_name && (
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-0.5">
            {msg.sender_name}
          </div>
        )}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.body}</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
        <span>{msg.created_date ? format(parseISO(msg.created_date), "h:mm a") : ""}</span>
        {isOwn && showReadStatus && (
          msg.read_by_client ? (
            <CheckCheck className="w-3 h-3 text-primary" />
          ) : (
            <Check className="w-3 h-3" />
          )
        )}
      </div>
    </div>
  );
}

export default function RealtimeMessaging({
  clientEmail,
  currentUser,
  isTrainer = false,
  threadId = null,
  threadType = null,
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const queryKey = ["messages", clientEmail, threadId || "general"];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const all = await base44.entities.Message.filter(
        { client_email: clientEmail },
        "-created_date",
        100
      );

      // Filter by thread
      if (!threadId) {
        return all.filter((m) => !m.schedule_id && !m.log_id);
      }
      if (threadType === "schedule") {
        return all.filter((m) => m.schedule_id === threadId);
      }
      if (threadType === "log") {
        return all.filter((m) => m.log_id === threadId);
      }
      return all;
    },
    enabled: !!clientEmail,
    refetchInterval: 5000, // Real-time polling every 5 seconds
  });

  // Mark messages as read (real-time sync)
  useEffect(() => {
    const unread = messages.filter((m) => {
      if (isTrainer) return !m.is_trainer && !m.read_by_trainer;
      return m.is_trainer && !m.read_by_client;
    });

    unread.forEach((m) => {
      const updates = isTrainer
        ? { read_by_trainer: true }
        : { read_by_client: true };
      base44.entities.Message.update(m.id, updates);
    });
  }, [messages, isTrainer]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (
        event.type === "create" &&
        event.data.client_email === clientEmail
      ) {
        qc.invalidateQueries({ queryKey });
      }
    });
    return unsubscribe;
  }, [clientEmail, qc, queryKey]);

  const send = async () => {
    if (!body.trim()) return;

    setSending(true);
    try {
      await base44.entities.Message.create({
        client_email: clientEmail,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || "User",
        is_trainer: isTrainer,
        body: body.trim(),
        schedule_id: threadType === "schedule" ? threadId : undefined,
        log_id: threadType === "log" ? threadId : undefined,
        read_by_trainer: isTrainer,
        read_by_client: !isTrainer,
      });

      setBody("");
      qc.invalidateQueries({ queryKey });
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      send();
    }
  };

  const unreadCount = messages.filter((m) => {
    if (isTrainer) return !m.is_trainer && !m.read_by_trainer;
    return m.is_trainer && !m.read_by_client;
  }).length;

  return (
    <div className="flex flex-col h-[500px] bg-card border border-border rounded-2xl overflow-hidden flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">
            {isTrainer ? `Chat with ${clientEmail}` : "Chat with Trainer"}
          </span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <div className="font-bold text-sm mb-1">No messages yet</div>
            <p className="text-xs text-muted-foreground">
              {isTrainer
                ? "Start the conversation or wait for the client to reach out."
                : "Send a message to get immediate support."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={
                isTrainer ? msg.is_trainer : !msg.is_trainer
              }
              showReadStatus={isTrainer}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Ctrl+Enter to send)"
            className="min-h-[60px] max-h-[120px] resize-none text-sm flex-1"
          />
          <Button
            onClick={send}
            disabled={sending || !body.trim()}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Press Ctrl+Enter to send · Messages sync in real-time
        </p>
      </div>
    </div>
  );
}