import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Pencil, RotateCcw } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import Button from "@/components/ui/Button";
import { generateLetter } from "@/services/api";
import { DOCUMENT_TYPE_LABELS, GeneratedDocument, GeneratedDocumentType } from "@/types";

const TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as GeneratedDocumentType[];

const FIELD_SETS: Record<GeneratedDocumentType, { key: string; label: string }[]> = {
  complaint_draft: [
    { key: "yourName", label: "Your name" },
    { key: "against", label: "Complaint against" },
    { key: "issueDescription", label: "What happened" },
  ],
  legal_notice: [
    { key: "yourName", label: "Your name" },
    { key: "recipientName", label: "Recipient's name" },
    { key: "matter", label: "Matter of the notice" },
    { key: "deadline", label: "Response deadline" },
  ],
  request_letter: [
    { key: "yourName", label: "Your name" },
    { key: "recipientName", label: "Recipient's name" },
    { key: "request", label: "What you're requesting" },
  ],
  consumer_complaint: [
    { key: "customerName", label: "Your name" },
    { key: "sellerName", label: "Seller / company name" },
    { key: "productOrService", label: "Product or service" },
    { key: "issueDescription", label: "What went wrong" },
    { key: "resolutionRequested", label: "What you want done" },
  ],
  salary_demand: [
    { key: "employeeName", label: "Your name" },
    { key: "employerName", label: "Employer's name" },
    { key: "periodOwed", label: "Period wages are owed for" },
    { key: "amountOwed", label: "Amount owed" },
  ],
};

type Step = "choose" | "details" | "preview";

export default function GenerateDocument() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [type, setType] = useState<GeneratedDocumentType | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [doc, setDoc] = useState<GeneratedDocument | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  function chooseType(t: GeneratedDocumentType) {
    setType(t);
    setDetails({});
    setStep("details");
  }

  async function handleGenerate() {
    if (!type) return;
    setGenerating(true);
    const result = await generateLetter(type, details);
    setDoc(result);
    setGenerating(false);
    setStep("preview");
  }

  function startOver() {
    setStep("choose");
    setType(null);
    setDetails({});
    setDoc(null);
    setEditing(false);
  }

  async function handleCopy() {
    if (!doc) return;
    await navigator.clipboard.writeText(doc.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!doc) return;
    const blob = new Blob([doc.body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-10">
      <TopBar title="Generate a document" onBack={() => (step === "choose" ? navigate("/") : startOver())} />

      <div className="px-5 pt-2 space-y-5">
        {step === "choose" && (
          <div className="space-y-2">
            <p className="text-sm text-muted mb-2">What would you like to generate?</p>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => chooseType(t)}
                className="w-full text-left rounded-xl2 border border-line bg-card px-4 py-4 text-sm font-semibold hover:border-ink/30 transition-colors"
              >
                {DOCUMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {step === "details" && type && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Review and fill in the details for your {DOCUMENT_TYPE_LABELS[type].toLowerCase()}.</p>
            {FIELD_SETS[type].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted" htmlFor={f.key}>
                  {f.label}
                </label>
                <input
                  id={f.key}
                  value={details[f.key] ?? ""}
                  onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl2 border border-line bg-card px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                />
              </div>
            ))}
            <Button fullWidth size="lg" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate draft"}
            </Button>
          </div>
        )}

        {step === "preview" && doc && (
          <div className="space-y-4">
            <div className="rounded-lg bg-chip px-3 py-2 text-xs font-medium text-center">
              AI-generated draft — review all details before using.
            </div>

            <div className="rounded-xl3 border border-line bg-card p-4">
              {editing ? (
                <textarea
                  value={doc.body}
                  onChange={(e) => setDoc({ ...doc, body: e.target.value })}
                  rows={16}
                  className="w-full text-sm leading-relaxed outline-none resize-none bg-transparent font-[inherit]"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-[inherit]">{doc.body}</pre>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" icon={<Pencil size={15} />} onClick={() => setEditing((e) => !e)}>
                {editing ? "Done editing" : "Edit"}
              </Button>
              <Button variant="secondary" icon={<Copy size={15} />} onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="primary" icon={<Download size={15} />} onClick={handleDownload}>
                Download
              </Button>
              <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={startOver}>
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
