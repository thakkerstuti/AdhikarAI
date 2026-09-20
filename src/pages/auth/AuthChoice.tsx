import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, ArrowRight, ChevronLeft } from "lucide-react";
import { storage } from "@/utils/storage";
import { getTranslation } from "@/data/translations";

export default function AuthChoice() {
  const navigate = useNavigate();
  const selectedLang = storage.getSelectedLanguage() || "en";
  const t = getTranslation(selectedLang);

  const handleGuestAccess = () => {
    storage.setUserProfile({
      name: "Guest User",
      isGuest: true,
      loggedIn: false,
    });
    storage.setOnboardingCompleted(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between px-6 pt-4 pb-6 select-none animate-fadeIn">
      {/* Top Navigation */}
      <header className="flex items-center justify-between h-14 pt-2">
        <button
          onClick={() => navigate("/onboarding")}
          aria-label="Back to onboarding"
          className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center text-ink hover:bg-chip transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-semibold tracking-widest text-muted uppercase">{t.step2Of2}</span>
      </header>

      {/* Hero / Main Section */}
      <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto my-auto space-y-8 py-4">
        {/* Brand Header Icon */}
        <div className="h-16 w-16 rounded-3xl bg-card border border-line/80 flex items-center justify-center shadow-soft">
          <span className="text-2xl font-black text-ink tracking-tighter">A</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-ink leading-tight">
            {t.authTitle}
          </h1>
          <p className="text-sm font-medium text-muted leading-relaxed">
            {t.authSubtitle}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Create Account Button */}
          <button
            onClick={() => navigate("/auth/signup")}
            className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90"
          >
            <div className="flex items-center gap-3">
              <UserPlus size={20} />
              <span>{t.createAccount}</span>
            </div>
            <ArrowRight size={18} />
          </button>

          {/* Sign In Button */}
          <button
            onClick={() => navigate("/auth/signin")}
            className="w-full h-14 rounded-2xl bg-card border border-line text-ink font-semibold text-base flex items-center justify-between px-5 shadow-sm hover:bg-chip active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <LogIn size={20} />
              <span>{t.signIn}</span>
            </div>
            <ArrowRight size={18} className="text-muted" />
          </button>
        </div>

        {/* Guest Access Link */}
        <div className="pt-2 text-center">
          <button
            onClick={handleGuestAccess}
            className="text-xs text-muted hover:text-ink font-semibold tracking-wide transition-colors py-2 px-4 rounded-xl hover:bg-chip"
          >
            {t.continueAsGuest} →
          </button>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="text-center text-[11px] text-muted py-2">
        Protected by end-to-end security & privacy standards.
      </footer>
    </div>
  );
}
