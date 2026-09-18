import { useNavigate } from "react-router-dom";
import { Keyboard, Upload, ScanLine, Landmark, Home as HomeIcon, Briefcase, ShoppingCart, HeartHandshake } from "lucide-react";
import VoiceButton from "@/components/VoiceButton";
import DocumentCard from "@/components/DocumentCard";
import { EXAMPLE_PROMPTS } from "@/data/mockData";
import { DOMAIN_LABELS, LegalDomain } from "@/types";

const DOMAIN_ICONS: Record<LegalDomain, typeof Landmark> = {
  police: Landmark,
  tenant: HomeIcon,
  employment: Briefcase,
  consumer: ShoppingCart,
  safety: HeartHandshake,
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-8 pb-28 space-y-9">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Adhikar AI</p>
        <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight">
          <span className="font-normal text-ink/70">Know your rights.</span>
          <br />
          Know your next step.
        </h1>
        <p className="text-sm text-muted leading-relaxed max-w-xs">
          Describe a situation, ask a question, or upload a document — in your own words, in your own language.
        </p>
      </header>

      <section className="flex flex-col items-center gap-3 py-2">
        <VoiceButton state="ready" onClick={() => navigate("/voice")} />
        <p className="text-sm font-semibold">Tap to speak</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <DocumentCard icon={Keyboard} title="Type your question" subtitle="Write it out instead" onClick={() => navigate("/ask")} />
        <DocumentCard icon={Upload} title="Upload document" subtitle="PDF or image" onClick={() => navigate("/upload")} />
        <DocumentCard icon={ScanLine} title="Scan document" subtitle="Use your camera" onClick={() => navigate("/upload?mode=scan")} />
        <DocumentCard icon={Landmark} title="Browse topics" subtitle="See what we cover" onClick={() => navigate("/ask")} />
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Try asking</h2>
        <div className="space-y-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("/ask", { state: { prefill: p.text } })}
              className="w-full text-left rounded-xl2 border border-line bg-card px-4 py-3.5 text-sm hover:border-ink/30 transition-colors"
            >
              "{p.text}"
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Areas we cover</h2>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(DOMAIN_LABELS) as LegalDomain[]).map((domain) => {
            const Icon = DOMAIN_ICONS[domain];
            return (
              <div key={domain} className="flex items-center gap-3 rounded-xl2 bg-card border border-line px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-chip flex items-center justify-center shrink-0">
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <p className="text-sm font-medium">{DOMAIN_LABELS[domain]}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
