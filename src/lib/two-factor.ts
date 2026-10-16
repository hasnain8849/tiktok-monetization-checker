// TOTP 2FA helper using otplib v13 (functional async API) + qrcode.
//
// otplib v13 requires explicit crypto + base32 plugins. We use the
// @otplib/plugin-crypto-noble and @otplib/plugin-base32-scure packages
// that ship with otplib (pure-JS, no native deps). All generate/verify
// calls are async.

import * as otplib from "otplib";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import QRCode from "qrcode";

const APP_NAME = "TikTok Monetization Checker";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();
const sharedOpts = { crypto, base32 };

// Generate a fresh base32 TOTP secret.
export function generateSecret(): string {
  return otplib.generateSecret(sharedOpts);
}

// Build the otpauth:// URI that authenticator apps scan as a QR code.
export function buildOtpAuthUri(email: string, secret: string): string {
  // otplib v13 doesn't expose a sync URI builder, so we construct the
  // otpauth:// URL manually following the standard format.
  const params = new URLSearchParams({
    secret,
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(
    email
  )}?${params.toString()}`;
}

// Generate a QR code as a data URL (PNG) for the given otpauth URI.
export async function generateQrDataUrl(otpauthUri: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUri, {
    width: 240,
    margin: 1,
    color: { dark: "#060b13", light: "#ffffff" },
  });
}

// Verify a 6-digit TOTP token against a secret. Async.
export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await otplib.verify({
      token: token.trim(),
      secret,
      ...sharedOpts,
    });
    return result.valid;
  } catch {
    return false;
  }
}

// Generate a fresh 6-digit token (for debugging / testing — useful in the
// sandbox where the user can't easily read the QR code from the dev env).
export async function generateTotpForTesting(secret: string): Promise<string> {
  return await otplib.generate({ secret, ...sharedOpts });
}

// Generate 8 one-time backup codes (8 chars each, alphanumeric, no ambiguous chars).
export function generateBackupCodes(count = 8): string[] {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    out.push(code);
  }
  return out;
}
