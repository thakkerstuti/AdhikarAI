// Auth Lambda Handler for AdhikarAI Demo Email OTP Authentication
// Implements POST /auth/signup, /auth/verify-otp, /auth/resend-otp,
// /auth/signin, /auth/forgot-password, /auth/reset-password.

import { ok, fail } from "../lib/response.js";
import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  generateOtp,
  verifyOtpHash,
  saveUser,
  getUserByEmail,
  updateUser,
  saveOtp,
  getOtp,
  incrementOtpAttempts,
  deleteOtp,
  OTP_COOLDOWN_SECONDS,
  MAX_OTP_ATTEMPTS,
} from "../lib/authHelper.js";
import { sendOtpEmail } from "../lib/resendHelper.js";

function parseBody(event) {
  try {
    return typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
  } catch {
    return {};
  }
}

function getRoute(event) {
  const path = event.path || event.requestContext?.path || event.requestContext?.http?.path || event.resource || "";
  // Strip stage prefix if present (e.g. /dev/auth/signup -> /auth/signup)
  const normalizedPath = path.replace(/^\/[a-zA-Z0-9_-]+(\/auth\/)/, "$1");
  return normalizedPath;
}

export async function handler(event) {
  const method = (event.httpMethod || event.requestContext?.http?.method || "POST").toUpperCase();
  const route = getRoute(event);
  const body = parseBody(event);

  if (method !== "POST") {
    return ok({ error: `Method ${method} not allowed` }, 405);
  }

  try {
    if (route.endsWith("/signup") || route === "/auth/signup") {
      return await handleSignup(body);
    }
    if (route.endsWith("/verify-otp") || route === "/auth/verify-otp") {
      return await handleVerifyOtp(body);
    }
    if (route.endsWith("/resend-otp") || route === "/auth/resend-otp") {
      return await handleResendOtp(body);
    }
    if (route.endsWith("/signin") || route === "/auth/signin") {
      return await handleSignin(body);
    }
    if (route.endsWith("/forgot-password") || route === "/auth/forgot-password") {
      return await handleForgotPassword(body);
    }
    if (route.endsWith("/reset-password") || route === "/auth/reset-password") {
      return await handleResetPassword(body);
    }

    return ok({ error: `Unknown auth endpoint: ${route}` }, 404);
  } catch (err) {
    return fail(err, 500);
  }
}

// ─── POST /auth/signup ────────────────────────────────────────────────────────
async function handleSignup(body) {
  const { name, email, password } = body;

  if (!email || !email.includes("@")) {
    return ok({ error: "Please provide a valid email address." }, 400);
  }
  if (!password || password.length < 6) {
    return ok({ error: "Password must be at least 6 characters long." }, 400);
  }
  if (!name || !name.trim()) {
    return ok({ error: "Full name is required." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const existingUser = await getUserByEmail(normEmail);

  if (existingUser && existingUser.isVerified) {
    return ok({ error: "An account already exists with this email. Please sign in." }, 400);
  }

  // Create or update pending user account
  await saveUser({
    email: normEmail,
    name: name.trim(),
    password,
    isVerified: false,
  });

  // Generate OTP and save to DynamoDB
  const otp = generateOtp();
  await saveOtp({ email: normEmail, otp, purpose: "SIGNUP" });

  // Send OTP Email via Resend
  await sendOtpEmail({
    to: normEmail,
    otp,
    purpose: "SIGNUP",
    name: name.trim(),
  });

  return ok({
    success: true,
    message: "Verification code sent to your email. Please enter the OTP to complete registration.",
    email: normEmail,
    requiresOtp: true,
  });
}

// ─── POST /auth/verify-otp ───────────────────────────────────────────────────
async function handleVerifyOtp(body) {
  const { email, otp, purpose = "SIGNUP" } = body;

  if (!email || !email.includes("@")) {
    return ok({ error: "Please provide a valid email address." }, 400);
  }
  if (!otp || String(otp).trim().length !== 6) {
    return ok({ error: "Please enter a valid 6-digit OTP." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const normPurpose = (purpose || "SIGNUP").toUpperCase();
  const otpRecord = await getOtp(normEmail, normPurpose);

  if (!otpRecord) {
    return ok({ error: "Verification code not found or expired. Please request a new OTP." }, 400);
  }

  if (Date.now() > otpRecord.expiresAt) {
    await deleteOtp(normEmail, normPurpose);
    return ok({ error: "Verification code has expired. Please request a new OTP." }, 400);
  }

  if ((otpRecord.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    await deleteOtp(normEmail, normPurpose);
    return ok({ error: "Maximum verification attempts exceeded. Please request a new OTP." }, 400);
  }

  const isValid = verifyOtpHash(String(otp).trim(), otpRecord.otpHash);

  if (!isValid) {
    const updated = await incrementOtpAttempts(normEmail, normPurpose);
    const attempts = updated ? updated.attempts : (otpRecord.attempts || 0) + 1;
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attempts);
    return ok(
      {
        error: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        remainingAttempts: remaining,
      },
      400
    );
  }

  // OTP verified successfully -> cleanup OTP
  await deleteOtp(normEmail, normPurpose);

  if (normPurpose === "SIGNUP") {
    const updatedUser = await updateUser(normEmail, { isVerified: true });
    return ok({
      success: true,
      message: "Email verified successfully. Welcome to AdhikarAI!",
      user: {
        id: updatedUser?.userId,
        email: normEmail,
        name: updatedUser?.name || "User",
        isVerified: true,
      },
    });
  }

  if (normPurpose === "RESET_PASSWORD") {
    return ok({
      success: true,
      message: "Code verified successfully. You may now reset your password.",
      email: normEmail,
    });
  }

  return ok({
    success: true,
    message: "OTP verified successfully.",
    email: normEmail,
  });
}

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────
async function handleResendOtp(body) {
  const { email, purpose = "SIGNUP" } = body;

  if (!email || !email.includes("@")) {
    return ok({ error: "Please provide a valid email address." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const normPurpose = (purpose || "SIGNUP").toUpperCase();
  const existingOtp = await getOtp(normEmail, normPurpose);

  if (existingOtp && existingOtp.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - existingOtp.lastSentAt) / 1000);
    if (elapsedSeconds < OTP_COOLDOWN_SECONDS) {
      const waitSeconds = OTP_COOLDOWN_SECONDS - elapsedSeconds;
      return ok(
        {
          error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting a new code.`,
          cooldownRemaining: waitSeconds,
        },
        429
      );
    }
  }

  const user = await getUserByEmail(normEmail);
  const otp = generateOtp();
  await saveOtp({ email: normEmail, otp, purpose: normPurpose });

  await sendOtpEmail({
    to: normEmail,
    otp,
    purpose: normPurpose,
    name: user?.name || "",
  });

  return ok({
    success: true,
    message: "A new verification code has been sent to your email.",
    email: normEmail,
  });
}

// ─── POST /auth/signin ────────────────────────────────────────────────────────
async function handleSignin(body) {
  const { email, password } = body;

  if (!email || !password) {
    return ok({ error: "Email and password are required." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const user = await getUserByEmail(normEmail);

  if (!user || !user.passwordHash) {
    return ok({ error: "Invalid email or password." }, 401);
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return ok({ error: "Invalid email or password." }, 401);
  }

  if (!user.isVerified) {
    // Send a new verification OTP
    const otp = generateOtp();
    await saveOtp({ email: normEmail, otp, purpose: "SIGNUP" });
    await sendOtpEmail({
      to: normEmail,
      otp,
      purpose: "SIGNUP",
      name: user.name || "",
    });

    return ok(
      {
        error: "Your email address is not yet verified. A new verification code has been sent.",
        requiresOtp: true,
        email: normEmail,
      },
      403
    );
  }

  return ok({
    success: true,
    message: "Signed in successfully.",
    user: {
      id: user.userId,
      email: user.email,
      name: user.name,
      isVerified: true,
    },
  });
}

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
async function handleForgotPassword(body) {
  const { email } = body;

  if (!email || !email.includes("@")) {
    return ok({ error: "Please provide a valid email address." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const user = await getUserByEmail(normEmail);

  // Return generic success to avoid user enumeration if user doesn't exist
  if (!user) {
    return ok({
      success: true,
      message: "If an account exists with this email, a reset code has been sent.",
      email: normEmail,
    });
  }

  // Check cooldown
  const existingOtp = await getOtp(normEmail, "RESET_PASSWORD");
  if (existingOtp && existingOtp.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - existingOtp.lastSentAt) / 1000);
    if (elapsedSeconds < OTP_COOLDOWN_SECONDS) {
      const waitSeconds = OTP_COOLDOWN_SECONDS - elapsedSeconds;
      return ok(
        {
          error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting a new code.`,
          cooldownRemaining: waitSeconds,
        },
        429
      );
    }
  }

  const otp = generateOtp();
  await saveOtp({ email: normEmail, otp, purpose: "RESET_PASSWORD" });

  await sendOtpEmail({
    to: normEmail,
    otp,
    purpose: "RESET_PASSWORD",
    name: user.name || "",
  });

  return ok({
    success: true,
    message: "Password reset code sent to your email.",
    email: normEmail,
  });
}

// ─── POST /auth/reset-password ───────────────────────────────────────────────
async function handleResetPassword(body) {
  const { email, otp, newPassword } = body;

  if (!email || !email.includes("@")) {
    return ok({ error: "Please provide a valid email address." }, 400);
  }
  if (!otp || String(otp).trim().length !== 6) {
    return ok({ error: "Please enter a valid 6-digit OTP." }, 400);
  }
  if (!newPassword || newPassword.length < 6) {
    return ok({ error: "New password must be at least 6 characters long." }, 400);
  }

  const normEmail = normalizeEmail(email);
  const otpRecord = await getOtp(normEmail, "RESET_PASSWORD");

  if (!otpRecord) {
    return ok({ error: "Reset code not found or expired. Please request a new code." }, 400);
  }

  if (Date.now() > otpRecord.expiresAt) {
    await deleteOtp(normEmail, "RESET_PASSWORD");
    return ok({ error: "Reset code has expired. Please request a new code." }, 400);
  }

  if ((otpRecord.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    await deleteOtp(normEmail, "RESET_PASSWORD");
    return ok({ error: "Maximum attempts exceeded. Please request a new code." }, 400);
  }

  const isValid = verifyOtpHash(String(otp).trim(), otpRecord.otpHash);
  if (!isValid) {
    const updated = await incrementOtpAttempts(normEmail, "RESET_PASSWORD");
    const attempts = updated ? updated.attempts : (otpRecord.attempts || 0) + 1;
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attempts);
    return ok(
      {
        error: `Invalid reset code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        remainingAttempts: remaining,
      },
      400
    );
  }

  // Update password and clean up OTP
  await deleteOtp(normEmail, "RESET_PASSWORD");
  const updatedUser = await updateUser(normEmail, {
    passwordHash: hashPassword(newPassword),
    isVerified: true,
  });

  if (!updatedUser) {
    return ok({ error: "User account not found." }, 404);
  }

  return ok({
    success: true,
    message: "Password has been successfully reset. You can now sign in with your new password.",
  });
}
