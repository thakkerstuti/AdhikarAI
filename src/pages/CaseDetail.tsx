import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Home, Briefcase, ShoppingCart, ShieldAlert, HeartHandshake, LucideIcon, Bell, FileEdit } from "lucide-react";
import TopBar from "@/components/ui/TopBar";
import Skeleton from "@/components/ui/Skeleton";
import LegalAnswer from "@/components/LegalAnswer";
import Button from "@/components/ui/Button";
import { DOMAIN_LABELS } from "@/types";
import { getCase } from "@/services/api";
import { CaseItem } from "@/types";

const ICONS: Record<string, LucideIcon> = { Home, Briefcase, ShoppingCart, ShieldAlert, HeartHandshake };

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<CaseItem | null | undefined>(null);

  useEffect(() => {
    if (id) getCase(id).then(setItem);
  }, [id]);

  if (item === null) {
    return (
      <div className="px-5 pt-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen">
        <TopBar title="Case not found" onBack={() => navigate("/cases")} />
        <p className="px-5 text-sm text-muted">We couldn't find that case.</p>
      </div>
    );
  }

  const Icon = ICONS[item.icon] ?? Home;

  return (
    <div className="min-h-screen pb-10">
      <TopBar title={item.title} onBack={() => navigate("/cases")} />

      <div className="px-5 pt-2 space-y-5">
        <div className="flex items-center gap-3 rounded-xl2 border border-line bg-card p-4">
          <div className="h-11 w-11 rounded-full bg-chip flex items-center justify-center shrink-0">
            <Icon size={19} />
          </div>
          <div>
            <p className="text-xs text-muted">{DOMAIN_LABELS[item.category]} · Updated {item.lastUpdated}</p>
            <p className="text-sm font-semibold mt-0.5">{item.nextAction}</p>
          </div>
        </div>

        {item.answer && <LegalAnswer answer={item.answer} />}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Bell size={15} />} onClick={() => navigate("/reminders")}>
            View reminders
          </Button>
          <Button variant="primary" icon={<FileEdit size={15} />} onClick={() => navigate("/generate")}>
            Generate letter
          </Button>
        </div>
      </div>
    </div>
  );
}
