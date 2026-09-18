import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, Plus, Send } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import LegalAnswer from "@/components/LegalAnswer";
import Skeleton from "@/components/ui/Skeleton";
import { askQuestion, speakAnswer } from "@/services/api";
import { ChatMessage } from "@/types";

export default function Ask() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { prefill?: string } };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(location.state?.prefill ?? "");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const answer = await askQuestion(text, "en");
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  }

  async function handleListen(text: string) {
    await speakAnswer(text, "en");
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      <TopBar title="Ask a question" onBack={() => navigate("/")} />

      <div className="flex-1 px-5 pt-2 space-y-5">
        {messages.length === 0 && !sending && (
          <p className="text-sm text-muted text-center pt-10">
            Describe what happened. We'll explain what it means and what you can do next.
          </p>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-chip px-4 py-3 text-sm leading-relaxed">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id}>{m.answer && <LegalAnswer answer={m.answer} compact onListen={() => handleListen(m.answer!.whatThisMeans)} />}</div>
          )
        )}

        {sending && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed bottom-0 left-0 right-0 px-5 pb-5 pt-3 bg-gradient-to-t from-paper via-paper/95 to-transparent"
      >
        <div className="mx-auto max-w-md flex items-center gap-2 rounded-full border border-line bg-card px-2 py-2 shadow-soft">
          <button type="button" aria-label="Add attachment" className="h-9 w-9 rounded-full bg-ink text-paper flex items-center justify-center shrink-0">
            <Plus size={16} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your legal issue…"
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => navigate("/voice")}
            aria-label="Switch to voice"
            className="h-9 shrink-0 rounded-full bg-ink text-paper px-3.5 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Mic size={13} /> Speak
          </button>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="h-9 w-9 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
