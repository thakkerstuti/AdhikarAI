import { LucideIcon } from "lucide-react";

interface DocumentCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export default function DocumentCard({ icon: Icon, title, subtitle, onClick }: DocumentCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl2 border border-line bg-card p-4 text-left hover:border-ink/30 transition-colors"
    >
      <div className="h-10 w-10 shrink-0 rounded-full bg-chip flex items-center justify-center">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
