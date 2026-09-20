// Authentication Helper for AdhikarAI Demo Auth
// Handles PBKDF2 password hashing, secure 6-digit OTP generation,
// hashing, verification attempts, resend cooldowns, and DynamoDB storage.

import crypto from "node:crypto";
import { v4 as uuid } from "uuid";
import { getItem, putItem, deleteItem } from "./dynamo.js";

export const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
export const OTP_COOLDOWN_SECONDS = 60; // 60 seconds
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Normalizes email strings to lowercase trimmed format.
 */
export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

/**
 * Hashes a plaintext password using PBKDF2 with a unique cryptographically random salt.
 */
export function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 10000;
  const keylen = 64;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${salt}:${iterations}:${keylen}:${digest}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash string.
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 5) {
    return false;
  }
  const [salt, iterationsStr, keylenStr, digest, originalHash] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const keylen = parseInt(keylenStr, 10);

  try {
    const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
  } catch (err) {
    console.error("[AuthHelper] verifyPassword error:", err);
    return false;
  }
}

/**
 * Generates a secure 6-digit OTP string.
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP using SHA-256 before storing it in DynamoDB.
 */
export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

/**
 * Verifies a candidate OTP against a stored SHA-256 hash.
 */
export function verifyOtpHash(otp, storedOtpHash) {
  if (!otp || !storedOtpHash) return false;
  try {
    const candidateHash = hashOtp(otp);
    return crypto.timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(storedOtpHash, "hex"));
  } catch {
    return false;
  }
}

// ─── User Profile DynamoDB Operations ────────────────────────────────────────

/**
 * Retrieves a user profile by normalized email.
 */
export async function getUserByEmail(email) {
  const normEmail = normalizeEmail(email);
  return getItem(`USER#${normEmail}`, "PROFILE");
}

/**
 * Creates or updates a user profile item in DynamoDB.
 */
export async function saveUser({ email, password, name, isVerified = false, userId }) {
  const normEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normEmail);
  const now = new Date().toISOString();

  const userItem = {
    pk: `USER#${normEmail}`,
    sk: "PROFILE",
    userId: userId || existing?.userId || uuid(),
    email: normEmail,
    name: name || existing?.name || "",
    passwordHash: password ? hashPassword(password) : existing?.passwordHash,
    isVerified: isVerified !== undefined ? isVerified : (existing?.isVerified || false),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await putItem(userItem);
  return userItem;
}

/**
 * Updates specific fields on an existing user.
 */
export async function updateUser(email, patch) {
  const normEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normEmail);
  if (!existing) return null;

  const updatedItem = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await putItem(updatedItem);
  return updatedItem;
}

// ─── OTP DynamoDB Operations ─────────────────────────────────────────────────

/**
 * Stores a new hashed OTP in DynamoDB with TTL and cooldown timestamp.
 */
export async function saveOtp({ email, otp, purpose = "SIGNUP" }) {
  const normEmail = normalizeEmail(email);
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_SECONDS * 1000;
  const ttl = Math.floor(expiresAt / 1000);

  const otpItem = {
    pk: `OTP#${normEmail}`,
    sk: purpose.toUpperCase(),
    email: normEmail,
    purpose: purpose.toUpperCase(),
    otpHash: hashOtp(otp),
    attempts: 0,
    maxAttempts: MAX_OTP_ATTEMPTS,
    createdAt: new Date(now).toISOString(),
    lastSentAt: now,
    expiresAt,
    ttl,
  };

  await putItem(otpItem);
  return otpItem;
}

/**
 * Retrieves an active OTP item from DynamoDB.
 */
export async function getOtp(email, purpose = "SIGNUP") {
  const normEmail = normalizeEmail(email);
  return getItem(`OTP#${normEmail}`, purpose.toUpperCase());
}

/**
 * Increments the verification attempt counter on an active OTP item.
 */
export async function incrementOtpAttempts(email, purpose = "SIGNUP") {
  const current = await getOtp(email, purpose);
  if (!current) return null;

  const updated = {
    ...current,
    attempts: (current.attempts || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  await putItem(updated);
  return updated;
}

/**
 * Deletes an OTP item after successful verification or expiration.
 */
export async function deleteOtp(email, purpose = "SIGNUP") {
  const normEmail = normalizeEmail(email);
  return deleteItem(`OTP#${normEmail}`, purpose.toUpperCase());
}
