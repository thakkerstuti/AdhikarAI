import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Globe, ArrowRight } from "lucide-react";
import { Language } from "@/types";
import { storage } from "@/utils/storage";
import { getTranslation } from "@/data/translations";

interface LanguageOption {
  code: Language;
  name: string;
  native: string;
  badge: string;
}

const EXTENSIBLE_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", badge: "EN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", badge: "HI" },
  { code: "hi-en", name: "Hinglish", native: "Hinglish (Hindi + English)", badge: "MIX" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", badge: "GU" },
];

export default function LanguageSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Language>(storage.getSelectedLanguage() || "en");
  const t = getTranslation(selected);

  const handleContinue = () => {
    storage.setSelectedLanguage(selected);
    // Proceed to translated onboarding landing page
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between px-6 pt-4 pb-6 select-none animate-fadeIn">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-14 pt-2">
        <span className="text-sm font-extrabold tracking-wider text-ink uppercase">Adhikar AI</span>
        <span className="text-xs font-bold tracking-widest text-muted uppercase">{t.step1Of2}</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto my-auto space-y-6 py-4">
        {/* Globe Header Icon */}
        <div className="h-16 w-16 rounded-3xl bg-card border border-line/80 flex items-center justify-center shadow-soft">
          <Globe size={30} className="text-ink" strokeWidth={1.8} />
        </div>

        <div className="space-y-1.5 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.chooseLanguage}</h1>
          <p className="text-sm text-muted leading-relaxed">{t.chooseLanguageDesc}</p>
        </div>

        {/* Language Options List */}
        <div className="space-y-3">
          {EXTENSIBLE_LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setSelected(lang.code);
                  storage.setSelectedLanguage(lang.code);
                }}
                aria-pressed={isSelected}
                className={`w-full h-[68px] flex items-center justify-between px-4 rounded-2xl text-left transition-all ${
                  isSelected
                    ? "bg-card border-2 border-ink shadow-soft"
                    : "bg-card border border-line hover:border-ink/30"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-10 rounded-xl bg-chip/90 flex items-center justify-center font-bold text-xs text-ink shrink-0 border border-line/60">
                    {lang.badge}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink leading-snug">{lang.native}</p>
                    <p className="text-xs text-muted">{lang.name}</p>
                  </div>
                </div>

                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? "bg-ink text-paper" : "border-2 border-line bg-transparent"
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={2.5} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Extensible note */}
        <p className="text-center text-[11px] text-muted pt-1">
          More Indian regional languages coming soon.
        </p>

        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90 mt-2"
        >
          <span>{t.continue}</span>
          <ArrowRight size={18} />
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-muted py-2">
        Language preferences are saved on your device.
      </footer>
    </div>
  );
}
