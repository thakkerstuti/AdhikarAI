import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, FileSearch } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import Button from "@/components/ui/Button";
import { SAMPLE_DOCUMENT_ANALYSIS } from "@/data/mockData";
import { DocumentAnalysis } from "@/types";

export default function DocumentResult() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { analysis?: DocumentAnalysis } };
  const analysis = location.state?.analysis ?? SAMPLE_DOCUMENT_ANALYSIS;

  return (
    <div className="min-h-screen pb-10">
      <TopBar title="Document summary" onBack={() => navigate("/")} />

      <div className="px-5 pt-2 space-y-6">
        <div className="rounded-xl3 border border-line bg-card p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-chip flex items-center justify-center shrink-0">
              <FileSearch size={19} />
            </div>
            <div>
              <p className="text-xs text-muted">What this document appears to be</p>
              <p className="text-sm font-semibold">{analysis.documentType}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed">{analysis.summary}</p>

          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Important points</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {analysis.importantPoints.map((p, i) => (
                <div key={i} className="rounded-xl2 bg-chip/60 px-3 py-2.5">
                  <p className="text-[11px] text-muted">{p.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{p.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">What this means for you</h3>
            <p className="text-sm leading-relaxed">{analysis.whatThisMeansForYou}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Things you should check</h3>
            <ul className="space-y-2">
              {analysis.thingsToCheck.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 size={15} className="text-verified mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Questions you may want to ask</h3>
          <div className="space-y-2">
            {analysis.questionsToAsk.map((q, i) => (
              <button
                key={i}
                onClick={() => navigate("/ask", { state: { prefill: q } })}
                className="w-full text-left rounded-xl2 border border-line bg-card px-4 py-3 text-sm hover:border-ink/30 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </section>

        <Button fullWidth size="lg" onClick={() => navigate("/generate")}>
          Generate a response
        </Button>
      </div>
    </div>
  );
}
