import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import { findOrGenerateProfile } from "@/lib/tiktok-data";
import { randomBytes } from "crypto";

// POST /api/profiles/[handle]/share
//
// Generates a public share token for the given handle's audit. The
// caller must be authenticated. The endpoint fetches the current
// audit (from cache or generated), snapshots it as JSON, and writes a
// ShareToken row. Returns the public URL the user can copy.
//
// Body (optional): { expiresInSeconds?: number } — if set, the share
// link expires after that many seconds. If null/missing, never expires.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle).trim().toLowerCase().replace(/^@/, "");
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  let expiresInSeconds: number | null = null;
  try {
    const body = (await req.json()) as { expiresInSeconds?: number | null };
    if (typeof body?.expiresInSeconds === "number" && body.expiresInSeconds > 0) {
      expiresInSeconds = body.expiresInSeconds;
    }
  } catch {
    // No body or invalid JSON — defaults to never-expiring.
  }

  try {
    // Fetch the current audit + snapshot it.
    const profile = findOrGenerateProfile(handle);
    const snapshot = {
      handle: profile.handle,
      displayName: profile.displayName,
      avatarInitials: profile.avatarInitials,
      bio: profile.bio,
      url: profile.url,
      verified: profile.verified,
      monetizationEligible: profile.monetizationEligible,
      region: profile.region,
      category: profile.category,
      metrics: profile.metrics,
      checks: profile.checks,
      engagementRate: profile.engagementRate,
      avgViewsPerVideo: profile.avgViewsPerVideo,
      recentVideos: profile.recentVideos,
      snapshotAt: new Date().toISOString(),
    };

    // Generate a 32-byte random token (url-safe base64).
    const token = randomBytes(24).toString("base64url");
    const expiresAt = expiresInSeconds
      ? new Date(Date.now() + expiresInSeconds * 1000)
      : null;

    await db.shareToken.create({
      data: {
        token,
        handle: profile.handle,
        userId,
        snapshotJson: JSON.stringify(snapshot),
        expiresAt,
      },
    });

    return NextResponse.json({
      ok: true,
      token,
      url: `/share/${token}`,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "share creation failed" }, { status: 500 });
  }
}
