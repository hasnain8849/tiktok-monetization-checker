import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyTotp } from "@/lib/two-factor";

// Email validation regex (simple — checks format only).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password rules: ≥ 8 chars, must contain a digit.
const MIN_PWD = 8;

function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
function validatePassword(pw: string): string | null {
  if (pw.length < MIN_PWD) return `Password must be at least ${MIN_PWD} characters`;
  if (!/\d/.test(pw)) return "Password must contain at least one digit";
  return null;
}

// The "credentials" provider supports both login and signup via the `action`
// field on the credentials payload. Login verifies the existing bcrypt hash;
// signup creates a new user row with a hashed password.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "text" }, // "login" | "signup"
        name: { label: "Name", type: "text" }, // signup-only
        totp: { label: "TOTP", type: "text" }, // 6-digit code, login-only when 2FA enabled
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();
        const action = (credentials?.action ?? "login").trim().toLowerCase();
        const totp = credentials?.totp?.trim() ?? "";

        if (!email || !password) {
          throw new Error("Email and password are required");
        }
        if (!validateEmail(email)) {
          throw new Error("Please enter a valid email address");
        }

        if (action === "signup") {
          const pwdErr = validatePassword(password);
          if (pwdErr) throw new Error(pwdErr);
          const existing = await db.user.findUnique({ where: { email } });
          if (existing) throw new Error("Email already registered — try logging in");
          const name = credentials?.name?.trim() || email.split("@")[0];
          const hash = await bcrypt.hash(password, 10);
          // Demo: any @admin.local email auto-promotes to admin role.
          const role = email.endsWith("@admin.local") ? "admin" : "user";
          const user = await db.user.create({
            data: { email, name, password: hash, role },
          });
          return { id: user.id, email: user.email, name: user.name ?? email, role };
        }

        // login path: verify bcrypt hash
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          throw new Error("Email not registered or no password set — sign up instead");
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Incorrect password");

        // 2FA check: if the user has a verified TOTP setup, require a valid
        // 6-digit code. Otherwise, allow the login to proceed.
        const twoFactor = await db.twoFactor.findUnique({
          where: { userId: user.id },
        });
        if (twoFactor?.verifiedAt) {
          if (!totp) {
            throw new Error("2FA code required — check your authenticator app");
          }
          // Allow either a TOTP code OR a one-time backup code.
          const backupCodes = JSON.parse(twoFactor.backupCodes ?? "[]") as string[];
          if (!backupCodes.includes(totp.toUpperCase())) {
            const isValid = await verifyTotp(totp, twoFactor.secret);
            if (!isValid) {
              throw new Error("Invalid 2FA code");
            }
          } else {
            // Burn the used backup code so it can't be reused.
            const remaining = backupCodes.filter((c) => c !== totp.toUpperCase());
            await db.twoFactor.update({
              where: { userId: user.id },
              data: { backupCodes: JSON.stringify(remaining) },
            });
          }
        }

        // 2FA enforcement for admin accounts: if the user is an admin AND
        // doesn't have 2FA enabled, refuse the login and prompt them to
        // set it up. This prevents the most-privileged accounts from being
        // accessed with just a stolen password.
        if (user.role === "admin" && !twoFactor?.verifiedAt) {
          throw new Error(
            "Admin accounts must enable 2FA before logging in. Sign in once as a non-admin, or ask another admin to disable the admin role temporarily, then set up 2FA from Settings."
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
  pages: { signIn: "/" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
