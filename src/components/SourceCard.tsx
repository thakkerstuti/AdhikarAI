import { ExternalLink, ShieldCheck } from "lucide-react";
import { Source } from "@/types";

export default function SourceCard({ source }: { source: Source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl2 border border-line bg-card p-4 hover:border-ink/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-verifiedBg text-verified flex items-center justify-center">
          <ShieldCheck size={16} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{source.name}</p>
          <p className="text-xs text-verified font-medium mt-0.5">{source.authority}</p>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">{source.description}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold mt-2 text-ink">
            View source <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </a>
  );
}
