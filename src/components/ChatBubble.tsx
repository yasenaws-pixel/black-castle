import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import { MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "مرحبا 👋 Hi! I'm the Nusub front desk. Ask me anything or book a chair." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSessionId(getSessionId()); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { session_id: sessionId, message: text },
      });
      if (error) throw error;
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "…" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry — I couldn't reach the desk. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elegant hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,380px)] h-[min(70vh,560px)] rounded-lg border border-border bg-card shadow-elegant flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <div className="font-display text-lg leading-none">Nusub Desk</div>
            <div className="text-xs text-muted-foreground mt-1">Bilingual • بالعربي أو English</div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-muted-foreground text-sm px-3 py-2 rounded-lg">typing…</div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border p-2 flex gap-2 bg-background"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-input rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground rounded px-3 disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
