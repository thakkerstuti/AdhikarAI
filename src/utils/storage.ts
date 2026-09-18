import { Language } from "@/types";

export interface UserProfile {
  name?: string;
  email?: string;
  isGuest: boolean;
  loggedIn: boolean;
}

const KEYS = {
  ONBOARDING_DONE: "adhikar_onboarding_completed",
  USER_PROFILE: "adhikar_user_profile",
  SELECTED_LANG: "adhikar_selected_language",
};

export const storage = {
  isOnboardingCompleted: (): boolean => {
    try {
      return localStorage.getItem(KEYS.ONBOARDING_DONE) === "true";
    } catch {
      return false;
    }
  },

  setOnboardingCompleted: (completed = true): void => {
    try {
      localStorage.setItem(KEYS.ONBOARDING_DONE, completed ? "true" : "false");
    } catch (e) {
      console.error("Failed to save onboarding state", e);
    }
  },

  resetOnboarding: (): void => {
    try {
      localStorage.removeItem(KEYS.ONBOARDING_DONE);
      localStorage.removeItem(KEYS.USER_PROFILE);
    } catch (e) {
      console.error("Failed to reset onboarding", e);
    }
  },

  getUserProfile: (): UserProfile | null => {
    try {
      const raw = localStorage.getItem(KEYS.USER_PROFILE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUserProfile: (profile: UserProfile): void => {
    try {
      localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save user profile", e);
    }
  },

  getSelectedLanguage: (): Language => {
    try {
      return (localStorage.getItem(KEYS.SELECTED_LANG) as Language) || "en";
    } catch {
      return "en";
    }
  },

  setSelectedLanguage: (lang: Language): void => {
    try {
      localStorage.setItem(KEYS.SELECTED_LANG, lang);
    } catch (e) {
      console.error("Failed to save language preference", e);
    }
  },
};
