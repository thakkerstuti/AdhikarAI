import { Language, LANGUAGE_LABELS } from "@/types";
import { Check } from "lucide-react";

const LANGS: Language[] = ["en", "hi", "hi-en", "gu"];

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
  layout?: "chips" | "list";
}

export default function LanguageSelector({ value, onChange, layout = "chips" }: LanguageSelectorProps) {
  if (layout === "list") {
    return (
      <div className="rounded-xl2 border border-line bg-card divide-y divide-line overflow-hidden">
        {LANGS.map((code) => (
          <button
            key={code}
            onClick={() => onChange(code)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-chip/50 transition-colors"
          >
            {LANGUAGE_LABELS[code]}
            {value === code && <Check size={16} strokeWidth={2.5} />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose language">
      {LANGS.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-pressed={value === code}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            value === code ? "bg-ink text-paper" : "bg-chip text-ink hover:bg-line"
          }`}
        >
          {LANGUAGE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
