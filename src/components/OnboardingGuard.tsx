import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storage } from "@/utils/storage";

const PUBLIC_PATHS = [
  "/language",
  "/onboarding",
  "/auth",
  "/auth/signup",
  "/auth/signin",
];

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset onboarding if reset URL parameter is present
    const searchParams = new URLSearchParams(location.search);
    if (
      searchParams.get("reset_onboarding") === "true" ||
      searchParams.get("reset") === "true"
    ) {
      storage.resetOnboarding();
      if (location.pathname !== "/language") {
        navigate("/language", { replace: true });
      }
      return;
    }

    const completed = storage.isOnboardingCompleted();
    const isPublic = PUBLIC_PATHS.some((path) =>
      location.pathname.startsWith(path)
    );

    // If onboarding is not completed and user is on a protected route, start at /language
    if (!completed && !isPublic) {
      navigate("/language", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return <>{children}</>;
}
