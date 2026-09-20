import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, Lock, ArrowRight, KeyRound, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { storage } from "@/utils/storage";
import { signInUser, verifyOtpCode, resendOtpCode, forgotPasswordRequest, resetPasswordWithOtp } from "@/services/api";

type AuthView = "signin" | "verify_signup" | "forgot_request" | "forgot_reset";

export default function SignIn() {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signInUser({
        email: trimmedEmail,
        password,
      });

      if (res.requiresOtp) {
        setView("verify_signup");
        setCooldown(60);
        setError("Please verify your email address to complete sign in. We sent you an OTP.");
      } else if (res.error) {
        setError(res.error);
      } else {
        storage.setUserProfile({
          name: res.user?.name || trimmedEmail.split("@")[0] || "User",
          email: res.user?.email || trimmedEmail,
          isGuest: false,
          loggedIn: true,
        });
        storage.setOnboardingCompleted(true);
        navigate("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpCode({
        email: email.trim(),
        otp: cleanOtp,
        purpose: "SIGNUP",
      });

      if (res.error) {
        setError(res.error);
      } else {
        storage.setUserProfile({
          name: res.user?.name || email.trim().split("@")[0] || "User",
          email: res.user?.email || email.trim(),
          isGuest: false,
          loggedIn: true,
        });
        storage.setOnboardingCompleted(true);
        navigate("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotPasswordOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email: trimmedEmail });
      if (res.error) {
        setError(res.error);
      } else {
        setView("forgot_reset");
        setCooldown(60);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit reset code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithOtp({
        email: email.trim(),
        otp: cleanOtp,
        newPassword,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setView("signin");
        setOtp("");
        setPassword("");
        setNewPassword("");
        setSuccessMessage("Password reset successfully! Please sign in with your new password.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (purpose: "SIGNUP" | "RESET_PASSWORD") => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await resendOtpCode({
        email: email.trim(),
        purpose,
      });

      if (res.error) {
        setError(res.error);
        if (res.cooldownRemaining) setCooldown(res.cooldownRemaining);
      } else {
        setCooldown(60);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    storage.setUserProfile({
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      isGuest: false,
      loggedIn: true,
    });
    storage.setOnboardingCompleted(true);
    navigate("/");
  };

  const getHeaderTitle = () => {
    switch (view) {
      case "verify_signup":
        return "Verify Account";
      case "forgot_request":
        return "Forgot Password";
      case "forgot_reset":
        return "Reset Password";
      default:
        return "Sign In";
    }
  };

  const handleBack = () => {
    setError(null);
    if (view === "forgot_reset") {
      setView("forgot_request");
    } else if (view === "forgot_request" || view === "verify_signup") {
      setView("signin");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between px-6 pt-4 pb-6 select-none animate-fadeIn">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-14 pt-2">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center text-ink hover:bg-chip transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-semibold tracking-widest text-muted uppercase">
          {getHeaderTitle()}
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto my-auto space-y-6 py-4">
        {/* Sign In View */}
        {view === "signin" && (
          <>
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
              <p className="text-sm text-muted">Sign in to access your saved cases and legal documents.</p>
            </div>

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-okBg border border-ok/20 text-ok text-xs leading-relaxed animate-fadeIn">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-warnBg border border-warn/20 text-warn text-xs leading-relaxed animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="ananya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setView("forgot_request");
                    }}
                    className="text-[11px] font-semibold text-muted hover:text-ink transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90 mt-2 disabled:opacity-60"
              >
                <span>{loading ? "Signing In…" : "Sign In"}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <span className="relative bg-paper px-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                Or sign in with
              </span>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialAuth("Google")}
                type="button"
                className="h-14 rounded-2xl bg-card border border-line flex items-center justify-center gap-2 text-xs font-semibold text-ink hover:bg-chip transition-colors shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                onClick={() => handleSocialAuth("Apple")}
                type="button"
                className="h-14 rounded-2xl bg-card border border-line flex items-center justify-center gap-2 text-xs font-semibold text-ink hover:bg-chip transition-colors shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4 fill-current text-ink" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.27c.61-.74 1.03-1.77.91-2.8-.89.04-1.98.6-2.61 1.33-.56.64-.97 1.69-.84 2.7.99.08 2.02-.49 2.54-1.23z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {/* Navigation Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/auth/signup")}
                className="text-xs text-muted hover:text-ink transition-colors font-medium"
              >
                Don't have an account? <span className="font-semibold underline">Create Account</span>
              </button>
            </div>
          </>
        )}

        {/* Verify Signup OTP View */}
        {view === "verify_signup" && (
          <>
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Verify your email</h1>
              <p className="text-sm text-muted leading-relaxed">
                Enter the 6-digit code sent to <strong className="text-ink font-semibold">{email}</strong>.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-warnBg border border-warn/20 text-warn text-xs leading-relaxed animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative flex items-center">
                  <KeyRound size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-center font-mono text-xl tracking-[0.35em] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => handleResendOtp("SIGNUP")}
                  disabled={cooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50 transition-colors"
                >
                  <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
                  <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="text-xs text-muted hover:text-ink font-medium"
                >
                  Back to Sign In
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90 mt-4 disabled:opacity-60"
              >
                <span>{loading ? "Verifying…" : "Verify & Sign In"}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {/* Forgot Password - Step 1: Request Code */}
        {view === "forgot_request" && (
          <>
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset Password</h1>
              <p className="text-sm text-muted leading-relaxed">
                Enter your registered email address and we'll send a 6-digit recovery code.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-warnBg border border-warn/20 text-warn text-xs leading-relaxed animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="ananya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90 mt-2 disabled:opacity-60"
              >
                <span>{loading ? "Sending Code…" : "Send Reset Code"}</span>
                <ArrowRight size={18} />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="text-xs text-muted hover:text-ink transition-colors font-medium"
                >
                  Remember password? <span className="font-semibold underline">Back to Sign In</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* Forgot Password - Step 2: Enter OTP & New Password */}
        {view === "forgot_reset" && (
          <>
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Set New Password</h1>
              <p className="text-sm text-muted leading-relaxed">
                Enter the code sent to <strong className="text-ink font-semibold">{email}</strong> and your new password.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-warnBg border border-warn/20 text-warn text-xs leading-relaxed animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  6-Digit Reset Code
                </label>
                <div className="relative flex items-center">
                  <KeyRound size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-center font-mono text-xl tracking-[0.35em] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-muted pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-card border border-line pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => handleResendOtp("RESET_PASSWORD")}
                  disabled={cooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50 transition-colors"
                >
                  <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
                  <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="text-xs text-muted hover:text-ink font-medium"
                >
                  Cancel
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6 || newPassword.length < 6}
                className="w-full h-14 rounded-2xl bg-ink text-paper font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all hover:bg-ink/90 mt-4 disabled:opacity-60"
              >
                <span>{loading ? "Updating…" : "Update Password"}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-muted py-2">
        Protected by end-to-end security & privacy standards.
      </footer>
    </div>
  );
}
