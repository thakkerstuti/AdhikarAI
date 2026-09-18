import { Info } from "lucide-react";

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2 text-muted ${compact ? "text-[11px]" : "text-xs"}`}>
      <Info size={compact ? 12 : 14} className="mt-0.5 shrink-0" />
      <p>
        Legal information for general guidance. This does not replace advice from a
        qualified lawyer.
      </p>
    </div>
  );
}
