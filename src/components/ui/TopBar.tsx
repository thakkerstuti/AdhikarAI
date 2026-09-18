import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
}

export default function TopBar({ title, onBack, showBack = true, right }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            aria-label="Go back"
            onClick={onBack ?? (() => navigate(-1))}
            className="h-10 w-10 rounded-full bg-chip flex items-center justify-center hover:bg-line transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
        {title && <h1 className="text-[15px] font-semibold">{title}</h1>}
        {right ? right : <div className="h-10 w-10" />}
      </div>
    </div>
  );
}
