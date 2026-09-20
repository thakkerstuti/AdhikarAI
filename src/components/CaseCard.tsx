import { ChevronRight, Home, Briefcase, ShoppingCart, ShieldAlert, HeartHandshake, LucideIcon } from "lucide-react";
import { CaseItem, DOMAIN_LABELS } from "@/types";
import { useNavigate } from "react-router-dom";

const ICONS: Record<string, LucideIcon> = {
  Home,
  Briefcase,
  ShoppingCart,
  ShieldAlert,
  HeartHandshake,
};

export default function CaseCard({ item }: { item: CaseItem }) {
  const navigate = useNavigate();
  const Icon = ICONS[item.icon] ?? Home;

  return (
    <button
      onClick={() => navigate(`/cases/${item.id}`)}
      className="w-full flex items-center gap-3 rounded-xl2 border border-line bg-card p-4 text-left hover:border-ink/30 transition-colors"
    >
      <div className="h-11 w-11 shrink-0 rounded-full bg-chip flex items-center justify-center">
        <Icon size={19} strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{item.title}</p>
          <span className="text-[10px] uppercase tracking-wide text-muted">{DOMAIN_LABELS[item.category]}</span>
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{item.description}</p>
        <p className="text-xs font-medium mt-1.5">{item.nextAction} · <span className="text-muted font-normal">{item.lastUpdated}</span></p>
      </div>
      <ChevronRight size={18} className="text-muted shrink-0" />
    </button>
  );
}
