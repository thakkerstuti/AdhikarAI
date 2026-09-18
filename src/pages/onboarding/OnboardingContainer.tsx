import { useState, useRef, TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, Mic, ShieldCheck, Landmark, Home as HomeIcon, Briefcase, ShoppingCart, HeartHandshake, FileText, CheckCircle2 } from "lucide-react";
import PaginationDots from "@/components/onboarding/PaginationDots";
import { storage } from "@/utils/storage";
import { getTranslation } from "@/data/translations";

export default function OnboardingContainer() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Get selected language & translations
  const selectedLang = storage.getSelectedLanguage() || "en";
  const t = getTranslation(selectedLang);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = distance > 50;
    const isSwipeRight = distance < -50;

    if (isSwipeLeft && currentSlide < 3) {
      setCurrentSlide((prev) => prev + 1);
    } else if (isSwipeRight && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate("/auth");
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    } else {
      navigate("/language");
    }
  };

  const handleSkip = () => {
    navigate("/auth");
  };

  return (
    <div
      className="min-h-screen bg-paper flex flex-col justify-between overflow-hidden relative selection:bg-chip select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Navigation */}
      <header className="px-5 pt-6 pb-1 flex items-center justify-between h-14 z-20">
        <div>
          {currentSlide > 0 ? (
            <button
              onClick={handleBack}
              aria-label="Go back to previous slide"
              className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center text-ink hover:bg-chip transition-colors shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button
              onClick={() => navigate("/language")}
              className="flex items-center gap-1.5 text-sm font-extrabold tracking-wider text-ink uppercase hover:text-ink/80 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Adhikar AI</span>
            </button>
          )}
        </div>

        {currentSlide < 3 && (
          <button
            onClick={handleSkip}
            className="px-3.5 py-1.5 text-xs font-bold tracking-wide text-ink/80 hover:text-ink transition-colors rounded-full hover:bg-chip"
          >
            {t.skip}
          </button>
        )}
      </header>

      {/* Slide Content Area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-0 z-10">
        {/* Slide 1: INTRODUCTION */}
        {currentSlide === 0 && (
          <div className="flex flex-col items-center text-center space-y-1 animate-fadeIn -mt-3">
            {/* Massive 3D Lady Justice Statue Artwork */}
            <div className="relative w-full max-w-[480px] h-[480px] sm:h-[540px] flex items-center justify-center overflow-visible">
              <img
                src="/lady-justice.png"
                alt="Lady Justice 3D Statue"
                className="max-h-[470px] sm:max-h-[530px] w-auto object-contain drop-shadow-2xl scale-115 transform transition-transform duration-500"
              />
            </div>

            <div className="space-y-2 max-w-sm z-10">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2] text-ink">
                {t.slide1TitleLine1}
                <br />
                <span className="text-ink font-bold">{t.slide1TitleLine2}</span>
              </h1>
              <p className="text-sm font-semibold text-ink/90 leading-relaxed px-2">
                {t.slide1Subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Slide 2: VOICE-FIRST */}
        {currentSlide === 1 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
            {/* Visual: Mic with Pulse + Speech Bubbles */}
            <div className="w-full max-w-sm bg-card border border-line rounded-3xl p-6 shadow-soft space-y-5">
              {/* Mic Circle */}
              <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-ink/10 animate-ping opacity-40" />
                <div className="h-16 w-16 rounded-full bg-ink text-paper flex items-center justify-center shadow-lg relative z-10">
                  <Mic size={28} />
                </div>
              </div>

              {/* Floating Conversation Bubbles */}
              <div className="space-y-2.5 text-left text-xs">
                <div className="bg-chip/80 border border-line/80 px-4 py-3 rounded-2xl rounded-tl-none font-bold text-ink flex items-center gap-2 shadow-sm">
                  <span>💬</span>
                  <span>{t.slide2Bubble1}</span>
                </div>
                <div className="bg-chip/80 border border-line/80 px-4 py-3 rounded-2xl rounded-tr-none ml-auto max-w-[85%] font-bold text-ink flex items-center gap-2 shadow-sm">
                  <span>💬</span>
                  <span>{t.slide2Bubble2}</span>
                </div>
                <div className="bg-chip/80 border border-line/80 px-4 py-3 rounded-2xl rounded-tl-none font-bold text-ink flex items-center gap-2 shadow-sm">
                  <span>💬</span>
                  <span>{t.slide2Bubble3}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2] text-ink">
                {t.slide2Title}
              </h1>
              <p className="text-sm font-semibold text-ink/90 leading-relaxed px-2">
                {t.slide2Subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Slide 3: SIMPLE LEGAL GUIDANCE */}
        {currentSlide === 2 && (
          <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
            {/* Mock Legal Answer Card */}
            <div className="w-full max-w-sm bg-card border border-line rounded-3xl p-5 text-left shadow-soft space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-line">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-verified bg-verifiedBg px-2.5 py-1 rounded-full">
                  <ShieldCheck size={13} /> {t.slide3CardOfficial}
                </span>
                <span className="text-[11px] font-semibold text-muted">{t.slide3CardInfo}</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">{t.slide3CardSituation}</p>
                <p className="text-xs font-bold text-ink">{t.slide3CardUnderstood}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">LEGAL GUIDANCE</p>
                <p className="text-xs font-semibold text-ink/90 leading-relaxed">{t.slide3Subtitle}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t.slide3CardNextSteps}</p>
                <ul className="text-xs text-ink space-y-1.5 font-bold">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-verified shrink-0" />
                    <span>{t.slide3CardStep1}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-verified shrink-0" />
                    <span>{t.slide3CardStep2}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-verified shrink-0" />
                    <span>{t.slide3CardStep3}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-line text-[10px] font-semibold text-muted flex items-center gap-1">
                <FileText size={12} />
                <span>Verified sources • Not legal representation</span>
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2] text-ink">
                {t.slide3TitleLine1}
                <br />
                <span className="text-ink font-bold">{t.slide3TitleLine2}</span>
              </h1>
              <p className="text-sm font-semibold text-ink/90 leading-relaxed px-2">
                {t.slide3Subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Slide 4: FIVE AREAS */}
        {currentSlide === 3 && (
          <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
            <div className="space-y-2 max-w-sm">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2] text-ink">
                {t.slide4Title}
              </h1>
              <p className="text-sm font-semibold text-ink/90 leading-relaxed px-2">
                {t.slide4Subtitle}
              </p>
            </div>

            {/* 5 Cards List */}
            <div className="w-full max-w-sm space-y-2 text-left">
              {[
                { icon: Landmark, title: t.area1Title, desc: t.area1Desc },
                { icon: HomeIcon, title: t.area2Title, desc: t.area2Desc },
                { icon: Briefcase, title: t.area3Title, desc: t.area3Desc },
                { icon: ShoppingCart, title: t.area4Title, desc: t.area4Desc },
                { icon: HeartHandshake, title: t.area5Title, desc: t.area5Desc },
              ].map((area, idx) => {
                const Icon = area.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 bg-card border border-line rounded-2xl p-3.5 shadow-sm hover:border-ink/20 transition-all"
                  >
                    <div className="h-9 w-9 rounded-xl bg-chip flex items-center justify-center shrink-0 text-ink">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{area.title}</p>
                      <p className="text-[11px] font-semibold text-muted truncate">{area.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <footer className="px-5 pb-6 pt-1 space-y-4 z-20">
        <PaginationDots total={4} current={currentSlide} onDotClick={setCurrentSlide} />

        <button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform hover:bg-ink/90"
        >
          <span>{currentSlide === 3 ? t.getStarted : t.next}</span>
          <ArrowRight size={18} />
        </button>
      </footer>
    </div>
  );
}
