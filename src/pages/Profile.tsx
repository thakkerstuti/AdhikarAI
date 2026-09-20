import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Volume2, Bell, FolderOpen, Lock, Info, ScrollText, RotateCcw, User } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import Disclaimer from "@/components/Disclaimer";
import { Language } from "@/types";
import { storage } from "@/utils/storage";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`h-6 w-11 rounded-full relative transition-colors shrink-0 ${checked ? "bg-ink" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Row({
  icon: Icon,
  label,
  right,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-9 w-9 rounded-full bg-chip flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {right ?? <ChevronRight size={16} className="text-muted" />}
    </div>
  );
  return onClick ? (
    <button onClick={onClick} className="w-full text-left hover:bg-chip/40 transition-colors">
      {content}
    </button>
  ) : (
    content
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>(storage.getSelectedLanguage() || "en");
  const [voiceOn, setVoiceOn] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const profile = storage.getUserProfile();

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    storage.setSelectedLanguage(newLang);
  };

  const handleResetOnboarding = () => {
    storage.resetOnboarding();
    navigate("/onboarding");
  };

  return (
    <div className="px-5 pt-8 pb-28 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>
        {profile && (
          <div className="flex items-center gap-2 bg-card border border-line px-3 py-1.5 rounded-full text-xs font-medium">
            <User size={13} className="text-muted" />
            <span>{profile.name || (profile.isGuest ? "Guest User" : "Account")}</span>
          </div>
        )}
      </header>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Preferred language</h2>
        <LanguageSelector value={lang} onChange={handleLanguageChange} />
      </section>

      <section className="rounded-xl2 border border-line bg-card divide-y divide-line overflow-hidden">
        <Row icon={Volume2} label="Voice response" right={<Toggle checked={voiceOn} onChange={() => setVoiceOn((v) => !v)} label="Voice response" />} />
        <Row icon={Bell} label="Notifications" right={<Toggle checked={notificationsOn} onChange={() => setNotificationsOn((v) => !v)} label="Notifications" />} />
      </section>

      <section className="rounded-xl2 border border-line bg-card divide-y divide-line overflow-hidden">
        <Row icon={FolderOpen} label="Saved cases" />
        <Row icon={RotateCcw} label="Re-watch Onboarding" onClick={handleResetOnboarding} />
        <Row icon={Lock} label="Privacy" />
        <Row icon={Info} label="About" />
        <Row icon={ScrollText} label="Legal disclaimer" />
      </section>

      <div className="px-1">
        <Disclaimer />
      </div>
    </div>
  );
}

