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
    <div className="min-h-screen pb-24 flex flex-col bg-paper">
      <TopBar title="Ask a question" onBack={() => navigate("/")} />

      <div className="flex-1 px-5 pt-3 pb-6 space-y-5 overflow-y-auto">
        {messages.length === 0 && !sending && (
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-ink">What is your legal question?</p>
              <p className="text-sm text-muted">
                Describe your situation in detail. We'll explain your rights, legal remedies, and exact next steps.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Common Topics</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Landlord refuses to refund security deposit",
                  "Employer delayed salary payment",
                  "Defective product return refund refusal",
                  "Police harassment or illegal search rights",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setInput(promptText);
                      send(promptText);
                    }}
                    className="text-left text-xs bg-card border border-line hover:border-ink/40 text-ink px-3 py-2 rounded-xl transition-colors"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink text-paper px-4 py-3 text-sm leading-relaxed shadow-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id}>
              {m.answer && (
                <LegalAnswer answer={m.answer} compact onListen={() => handleListen(m.answer!.whatThisMeans)} />
              )}
            </div>
          )
        )}

        {sending && (
          <div className="space-y-3 p-4 rounded-2xl border border-line bg-card">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 left-0 right-0 z-40 bg-paper border-t border-line px-3 py-2.5 shadow-md"
      >
        <div className="mx-auto max-w-md flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1.5 focus-within:border-ink transition-colors">
          <button
            type="button"
            onClick={() => navigate("/upload")}
            aria-label="Attach document"
            title="Attach document"
            className="h-9 w-9 rounded-full bg-chip text-ink flex items-center justify-center shrink-0 hover:bg-ink hover:text-paper transition-colors"
          >
            <Plus size={18} />
          </button>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your legal issue here..."
            style={{ outline: "none", border: "none", boxShadow: "none" }}
            className="flex-1 bg-transparent text-sm min-w-0 text-ink placeholder:text-muted py-1 outline-none focus:outline-none focus:ring-0"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => navigate("/voice")}
            aria-label="Switch to voice"
            title="Voice Assistant"
            className="h-9 w-9 rounded-full bg-chip text-ink hover:bg-ink hover:text-paper flex items-center justify-center shrink-0 transition-colors"
          >
            <Mic size={17} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send question"
            title="Send"
            className="h-9 w-9 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
