import { AlertTriangle, Volume2 } from "lucide-react";
import { DOMAIN_LABELS, LegalAnswerData } from "@/types";
import ActionCard from "./ActionCard";
import SourceCard from "./SourceCard";
import Disclaimer from "./Disclaimer";

interface LegalAnswerProps {
  answer: LegalAnswerData;
  onListen?: () => void;
  compact?: boolean;
}

export default function LegalAnswer({ answer, onListen, compact = false }: LegalAnswerProps) {
  return (
    <div className={`rounded-xl3 border border-line bg-card ${compact ? "p-4" : "p-5"} space-y-5`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-chip px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {DOMAIN_LABELS[answer.domain]}
        </span>
        {answer.isEmergency && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warnBg px-3 py-1 text-xs font-semibold text-warn">
            <AlertTriangle size={12} /> Urgent
          </span>
        )}
      </div>

      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Your situation</h3>
        <p className="mt-1.5 text-sm leading-relaxed">{answer.situationSummary}</p>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">What this means</h3>
        <p className="mt-1.5 text-sm leading-relaxed">{answer.whatThisMeans}</p>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">What you can do</h3>
        <div className="space-y-2">
          {answer.nextSteps.map((step, i) => (
            <ActionCard key={i} index={i + 1} text={step} />
          ))}
        </div>
      </section>

      {answer.documentsNeeded.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Documents you may need</h3>
          <ul className="space-y-1.5">
            {answer.documentsNeeded.map((doc, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ink/60" /> {doc}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Sources</h3>
        <div className="space-y-2">
          {answer.sources.map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-3 border-t border-line">
        <Disclaimer compact />
        {onListen && (
          <button
            onClick={onListen}
            aria-label="Listen to this answer"
            className="shrink-0 ml-3 inline-flex items-center gap-1.5 rounded-full bg-chip px-3.5 py-2 text-xs font-semibold hover:bg-line transition-colors"
          >
            <Volume2 size={14} /> Listen
          </button>
        )}
      </div>
    </div>
  );
}
