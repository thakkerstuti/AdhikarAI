import { Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Home from "@/pages/Home";
import Voice from "@/pages/Voice";
import Ask from "@/pages/Ask";
import DocumentUpload from "@/pages/DocumentUpload";
import DocumentResult from "@/pages/DocumentResult";
import LegalResult from "@/pages/LegalResult";
import GenerateDocument from "@/pages/GenerateDocument";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import Reminders from "@/pages/Reminders";
import Profile from "@/pages/Profile";

import OnboardingContainer from "@/pages/onboarding/OnboardingContainer";
import AuthChoice from "@/pages/auth/AuthChoice";
import CreateAccount from "@/pages/auth/CreateAccount";
import SignIn from "@/pages/auth/SignIn";
import LanguageSelection from "@/pages/LanguageSelection";
import OnboardingGuard from "@/components/OnboardingGuard";

const HIDE_BOTTOM_NAV = [
  "/voice",
  "/onboarding",
  "/auth",
  "/auth/signup",
  "/auth/signin",
  "/language",
];

export default function App() {
  const location = useLocation();
  const showBottomNav = !HIDE_BOTTOM_NAV.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen mx-auto max-w-md bg-paper">
      <OnboardingGuard>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingContainer />} />
          <Route path="/auth" element={<AuthChoice />} />
          <Route path="/auth/signup" element={<CreateAccount />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/language" element={<LanguageSelection />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/document/result" element={<DocumentResult />} />
          <Route path="/result/:id" element={<LegalResult />} />
          <Route path="/generate" element={<GenerateDocument />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </OnboardingGuard>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

