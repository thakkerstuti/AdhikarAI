import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import CaseCard from "@/components/CaseCard";
import { getCases } from "@/services/api";
import { CaseItem } from "@/types";

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[] | null>(null);

  useEffect(() => {
    getCases().then(setCases);
  }, []);

  return (
    <div className="px-5 pt-8 pb-28 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">My Cases</h1>
        <p className="text-sm text-muted mt-1">Situations you've asked about, saved for later.</p>
      </header>

      {cases === null && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {cases?.length === 0 && (
        <div className="text-center pt-16 space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-chip flex items-center justify-center">
            <FolderOpen size={22} />
          </div>
          <p className="text-sm text-muted">No saved cases yet.</p>
        </div>
      )}

      {cases && cases.length > 0 && (
        <div className="space-y-2.5">
          {cases.map((c) => (
            <CaseCard key={c.id} item={c} />
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("/ask")}
        className="w-full rounded-xl2 border border-dashed border-line bg-transparent px-4 py-4 text-sm font-medium text-muted hover:border-ink/30 hover:text-ink transition-colors"
      >
        + Start a new case
      </button>
    </div>
  );
}
