import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface SessionInfo {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export async function getSessionInfo(): Promise<SessionInfo | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const id = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role ?? "user";
  if (!id) return null;
  return { userId: id, email: session.user.email ?? "", role: role as "user" | "admin" };
}

export async function getAuthUserId(): Promise<string | null> {
  const s = await getSessionInfo();
  return s?.userId ?? null;
}

export async function requireAdmin(): Promise<SessionInfo | null> {
  const s = await getSessionInfo();
  if (!s || s.role !== "admin") return null;
  return s;
}

// Demo: any email ending in @admin.local is auto-promoted to admin on first
// signup/login. Used by the credentials provider to make admin access easy
// in the demo (e.g., owner@admin.local).
export function isDemoAdminEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@admin.local");
}
