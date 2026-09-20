// Automated Test Suite for AdhikarAI Auth Handlers (Phase 10)
// Tests Signup, Email OTP Verification, Resend Cooldown, Signin,
// Password Reset, Attempt Limiting, and Offline Mock Behavior.

import test from "node:test";
import assert from "node:assert/strict";

// Force mock environment variables
process.env.MOCK_DYNAMO = "true";
process.env.USE_MOCK_RESEND = "true";
process.env.AWS_REGION = "ap-south-1";

import { handler as authHandler } from "../src/handlers/auth.js";
import {
  getUserByEmail,
  getOtp,
  hashPassword,
  verifyPassword,
  saveUser,
  saveOtp,
  OTP_COOLDOWN_SECONDS,
} from "../src/lib/authHelper.js";

test("Auth 1: POST /auth/signup - Valid Signup & OTP Generation", async () => {
  const email = "citizen.test@example.com";
  const name = "Priya Sharma";
  const password = "SecuredPassword123";

  const res = await authHandler({
    httpMethod: "POST",
    path: "/auth/signup",
    body: JSON.stringify({ email, name, password }),
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
  assert.equal(data.requiresOtp, true);
  assert.equal(data.email, email.toLowerCase());

  // Verify user item in DynamoDB
  const user = await getUserByEmail(email);
  assert.ok(user, "User record must exist in DB");
  assert.equal(user.email, email.toLowerCase());
  assert.equal(user.name, name);
  assert.equal(user.isVerified, false, "User should be unverified before OTP");
  assert.ok(verifyPassword(password, user.passwordHash), "Password must match PBKDF2 hash");

  // Verify OTP item in DynamoDB
  const otpRecord = await getOtp(email, "SIGNUP");
  assert.ok(otpRecord, "OTP record must exist in DB");
  assert.equal(otpRecord.purpose, "SIGNUP");
  assert.equal(otpRecord.attempts, 0);
  assert.ok(otpRecord.otpHash, "OTP hash must be stored");
  assert.ok(otpRecord.ttl, "TTL must be present for DynamoDB cleanup");
});

test("Auth 2: POST /auth/signup - Validation Errors", async () => {
  // Invalid email
  const res1 = await authHandler({
    httpMethod: "POST",
    path: "/auth/signup",
    body: JSON.stringify({ email: "invalid-email", name: "Test", password: "password123" }),
  });
  assert.equal(res1.statusCode, 400);

  // Short password
  const res2 = await authHandler({
    httpMethod: "POST",
    path: "/auth/signup",
    body: JSON.stringify({ email: "valid@example.com", name: "Test", password: "123" }),
  });
  assert.equal(res2.statusCode, 400);

  // Missing name
  const res3 = await authHandler({
    httpMethod: "POST",
    path: "/auth/signup",
    body: JSON.stringify({ email: "valid@example.com", name: "", password: "password123" }),
  });
  assert.equal(res3.statusCode, 400);
});

test("Auth 3: POST /auth/verify-otp - Invalid Code & Attempt Throttling", async () => {
  const email = "throttle.test@example.com";
  await saveUser({ email, name: "Throttled User", password: "password123", isVerified: false });
  await saveOtp({ email, otp: "123456", purpose: "SIGNUP" });

  // Attempt 1: Wrong code
  const res1 = await authHandler({
    httpMethod: "POST",
    path: "/auth/verify-otp",
    body: JSON.stringify({ email, otp: "999999", purpose: "SIGNUP" }),
  });
  assert.equal(res1.statusCode, 400);
  const data1 = JSON.parse(res1.body);
  assert.equal(data1.remainingAttempts, 4);

  // Remaining 4 attempts to trigger lock
  for (let i = 2; i <= 5; i++) {
    await authHandler({
      httpMethod: "POST",
      path: "/auth/verify-otp",
      body: JSON.stringify({ email, otp: "000000", purpose: "SIGNUP" }),
    });
  }

  // Attempt 6: Max exceeded
  const resExceeded = await authHandler({
    httpMethod: "POST",
    path: "/auth/verify-otp",
    body: JSON.stringify({ email, otp: "123456", purpose: "SIGNUP" }),
  });
  assert.equal(resExceeded.statusCode, 400);
  assert.match(JSON.parse(resExceeded.body).error, /exceeded|expired|not found/i);
});

test("Auth 4: POST /auth/verify-otp - Successful Verification & Account Activation", async () => {
  const email = "verify.success@example.com";
  await saveUser({ email, name: "Verified Citizen", password: "password123", isVerified: false });
  await saveOtp({ email, otp: "654321", purpose: "SIGNUP" });

  const res = await authHandler({
    httpMethod: "POST",
    path: "/auth/verify-otp",
    body: JSON.stringify({ email, otp: "654321", purpose: "SIGNUP" }),
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
  assert.equal(data.user.email, email);
  assert.equal(data.user.isVerified, true);

  // Check DB state
  const user = await getUserByEmail(email);
  assert.equal(user.isVerified, true);

  const otp = await getOtp(email, "SIGNUP");
  assert.equal(otp, null, "OTP should be deleted upon verification");
});

test("Auth 5: POST /auth/resend-otp - Cooldown Enforcement", async () => {
  const email = "cooldown.test@example.com";
  await saveUser({ email, name: "Cooldown Test", password: "password123" });
  await saveOtp({ email, otp: "111222", purpose: "SIGNUP" });

  // Immediate resend attempt should be blocked by 60s cooldown
  const resCooldown = await authHandler({
    httpMethod: "POST",
    path: "/auth/resend-otp",
    body: JSON.stringify({ email, purpose: "SIGNUP" }),
  });

  assert.equal(resCooldown.statusCode, 429);
  const cooldownData = JSON.parse(resCooldown.body);
  assert.ok(cooldownData.cooldownRemaining > 0);

  // Simulate cooldown expired
  const otpRecord = await getOtp(email, "SIGNUP");
  otpRecord.lastSentAt = Date.now() - (OTP_COOLDOWN_SECONDS + 5) * 1000;
  await saveUser(otpRecord); // in local store or putItem

  // Now resend should succeed
  const resAllowed = await authHandler({
    httpMethod: "POST",
    path: "/auth/resend-otp",
    body: JSON.stringify({ email, purpose: "SIGNUP" }),
  });
  assert.equal(resAllowed.statusCode, 200);
  assert.equal(JSON.parse(resAllowed.body).success, true);
});

test("Auth 6: POST /auth/signin - Valid and Invalid Credentials", async () => {
  const email = "signin.test@example.com";
  const password = "CorrectPassword123";
  await saveUser({ email, name: "Signin User", password, isVerified: true });

  // 1. Valid signin
  const resValid = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(resValid.statusCode, 200);
  const data = JSON.parse(resValid.body);
  assert.equal(data.success, true);
  assert.equal(data.user.email, email);

  // 2. Incorrect password
  const resWrongPass = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email, password: "WrongPassword" }),
  });
  assert.equal(resWrongPass.statusCode, 401);

  // 3. Non-existent email
  const resNonExistent = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email: "nonexistent@example.com", password }),
  });
  assert.equal(resNonExistent.statusCode, 401);
});

test("Auth 7: POST /auth/signin - Unverified Account Flow", async () => {
  const email = "unverified.user@example.com";
  const password = "ValidPassword123";
  await saveUser({ email, name: "Unverified User", password, isVerified: false });

  const res = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email, password }),
  });

  assert.equal(res.statusCode, 403);
  const data = JSON.parse(res.body);
  assert.equal(data.requiresOtp, true);
  assert.equal(data.email, email);

  // Verify that an OTP was generated and saved
  const otp = await getOtp(email, "SIGNUP");
  assert.ok(otp, "A new OTP should have been generated for the unverified user");
});

test("Auth 8: POST /auth/forgot-password & POST /auth/reset-password", async () => {
  const email = "forgot.pass@example.com";
  const oldPassword = "OldPassword123";
  const newPassword = "NewSecuredPassword456";

  await saveUser({ email, name: "Reset User", password: oldPassword, isVerified: true });

  // 1. Request forgot password OTP
  const resForgot = await authHandler({
    httpMethod: "POST",
    path: "/auth/forgot-password",
    body: JSON.stringify({ email }),
  });
  assert.equal(resForgot.statusCode, 200);
  assert.equal(JSON.parse(resForgot.body).success, true);

  // Seed fixed OTP for testing reset
  await saveOtp({ email, otp: "778899", purpose: "RESET_PASSWORD" });

  // 2. Reset password with invalid code
  const resInvalid = await authHandler({
    httpMethod: "POST",
    path: "/auth/reset-password",
    body: JSON.stringify({ email, otp: "000000", newPassword }),
  });
  assert.equal(resInvalid.statusCode, 400);

  // 3. Reset password with valid code
  const resReset = await authHandler({
    httpMethod: "POST",
    path: "/auth/reset-password",
    body: JSON.stringify({ email, otp: "778899", newPassword }),
  });
  assert.equal(resReset.statusCode, 200);
  assert.equal(JSON.parse(resReset.body).success, true);

  // 4. Old password should now fail
  const resOld = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email, password: oldPassword }),
  });
  assert.equal(resOld.statusCode, 401);

  // 5. New password should succeed
  const resNew = await authHandler({
    httpMethod: "POST",
    path: "/auth/signin",
    body: JSON.stringify({ email, password: newPassword }),
  });
  assert.equal(resNew.statusCode, 200);
  assert.equal(JSON.parse(resNew.body).success, true);
});
