import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import SectionBadge from "@/components/shared/SectionBadge";
import { mason } from "@/lib/mason";

const QUICK_PROMPTS = [
  "Prices", "Slip Lead", "Book Saturday", "PoopPatrol",
  "Walk & Talks", "Memberships", "Deals", "My dog pulls",
];

export default function MasonChat() {
  const [msgs, setMsgs] = useState([{ r: "bot", t: mason("help") }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  const send = useCallback((text) => {
    const m = (text || input).trim();
    if (!m) return;
    setMsgs((p) => [...p, { r: "user", t: m }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((p) => [...p, { r: "bot", t: mason(m) }]);
      setTyping(false);
    }, 500 + Math.random() * 400);
  }, [input]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <div className="text-center mb-8">
        <SectionBadge>Mason™ AI</SectionBadge>
        <h1 className="font-heading text-3xl md:text-4xl">
          Your 24/7 <span className="italic text-primary">AI Coach</span>
        </h1>
      </div>

      {/* Chat container */}
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-foreground text-background px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
            M
          </div>
          <div>
            <div className="font-bold text-sm">Mason™ Super Agent</div>
            <div className="text-[11px] text-secondary font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="h-[450px] overflow-y-auto p-5 space-y-5 chat-scroll">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.r === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.r === "user"
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                {m.t}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-1.5 px-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{
                    animation: `typing-dot 1.2s ${i * 0.15}s infinite`,
                  }}
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
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Mason anything..."
            className="rounded-full h-12 px-5"
          />
          <Button
            onClick={() => send()}
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
            className="text-xs font-medium px-4 py-2 rounded-full border border-border bg-card hover:bg-accent transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}