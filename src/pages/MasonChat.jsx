import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import SectionBadge from "@/components/shared/SectionBadge";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  "Start intake questionnaire 🐾",
  "What services do you offer?",
  "My dog is aggressive",
  "Pricing & packages",
  "Saturday class info",
  "Do you offer military discount?",
];

export default function MasonChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const chatRef = useRef(null);

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "mason",
          metadata: { name: "Mason™ Client Intake" },
        });
        console.log("[MasonChat Init] Conversation created:", conv);
        if (!conv || !conv.id) {
          console.error("[MasonChat Init] Invalid conversation response:", conv);
          setInitializing(false);
          return;
        }
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (e) {
        console.error("[MasonChat Init Error]", e);
        setInitializing(false);
      }
    };
    init();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text) => {
    const m = (text || input).trim();
    if (!m || loading || !conversation?.id) return;
    setInput("");
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation.id, {
        role: "user",
        content: m,
      });
      // Fetch updated conversation
      const updated = await base44.agents.getConversation(conversation.id);
      setConversation(updated);
      setMessages(updated.messages || []);
    } catch (e) {
      console.error("[MasonChat Error]", e);
      setInput(m); // Restore input on error
    } finally {
      setLoading(false);
    }
  };

  const isTyping = loading || messages[messages.length - 1]?.role === "user";

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <div className="text-center mb-8">
        <SectionBadge>Mason™ Super Agent</SectionBadge>
        <h1 className="font-heading text-3xl md:text-4xl">
          Your 24/7 <span className="italic text-primary">AI Coach</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Mason will ask you 10 questions to understand your dog's needs, then recommend the perfect solution — or connect you directly with Omar.
        </p>
      </div>

      {/* Chat container */}
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
            M
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Mason™ Super Agent</div>
            <div className="text-[11px] text-secondary font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              {initializing ? "Initializing..." : "Online · AI-Powered"}
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-primary opacity-70" />
        </div>

        {/* Messages */}
        <div ref={chatRef} className="h-[500px] overflow-y-auto p-5 space-y-4 chat-scroll">
          {initializing ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Mason is warming up... 🐾
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 bg-muted text-sm leading-relaxed">
                Hey! I'm Mason™ — Omar's AI training assistant. I'm going to ask you 10 quick questions to understand you and your dog better. Ready? Let's go! 🐾
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="my-1">{children}</p>,
                        ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && !initializing && (
            <div className="flex gap-1.5 px-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{ animation: `typing-dot 1.2s ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
            placeholder="Type your answer or question..."
            className="rounded-full h-12 px-5"
            disabled={initializing || loading}
          />
          <Button
            onClick={() => send()}
            disabled={initializing || loading || !input.trim()}
            className="rounded-full h-12 w-12 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mt-5 justify-center">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={initializing || loading}
            className="text-xs font-medium px-4 py-2 rounded-full border border-border bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Need to speak with Omar directly? 📞 <a href="tel:3218306272" className="text-primary font-semibold hover:underline">(321) 830-6272</a> · <a href="mailto:info@omarsdogtraining.com" className="text-primary font-semibold hover:underline">info@omarsdogtraining.com</a>
      </p>
    </div>
  );
}