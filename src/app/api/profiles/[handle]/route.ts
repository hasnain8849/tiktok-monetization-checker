import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  findOrGenerateProfile,
  type Profile,
  type EligibilityCheck,
} from "@/lib/tiktok-data";

// Apply the unlock effect: if a profile has paid the unlock fee, force every
// failed eligibility check to "passed" and flip monetizationEligible.
function applyUnlock(p: Profile): Profile {
  return {
    ...p,
    monetizationEligible: true,
    checks: p.checks.map((c) =>
      c.passed
        ? c
        : { ...c, passed: true, actual: c.actual === "Restricted" ? "Clean" : c.actual }
    ),
  };
}

async function fetchProfileFromSource(handle: string): Promise<Profile | null> {
  const normalized = handle.trim().toLowerCase().replace(/^@/, "");

  // 1. Check if this profile has paid the unlock fee.
  let unlocked = false;
  try {
    const unlockRow = await db.unlockedProfile.findUnique({
      where: { handle: normalized },
    });
    unlocked = !!unlockRow;
  } catch (e) {
    console.warn("Unlock lookup failed:", e);
  }

  // 2. Try DB cache first (fast path for re-checks)
  try {
    const cached = await db.cachedProfile.findUnique({
      where: { handle: normalized },
    });
    if (cached && Date.now() - cached.fetchedAt.getTime() < 1000 * 60 * 60) {
      const profile: Profile = {
        id: cached.id,
        handle: `@${cached.handle}`,
        displayName: cached.displayName,
        avatarInitials: cached.avatarInitials,
        bio: cached.bio,
        url: cached.url,
        verified: cached.verified,
        monetizationEligible: cached.monetizationEligible,
        region: cached.region,
        category: cached.category,
        accountAgeDays: cached.accountAgeDays,
        engagementRate: cached.engagementRate,
        avgViewsPerVideo: cached.avgViewsPerVideo,
        metrics: {
          followers: cached.followers,
          following: cached.following,
          likes: cached.likes,
          videos: cached.videos,
        },
        checks: JSON.parse(cached.checksJson) as EligibilityCheck[],
        recentVideos: JSON.parse(cached.recentVideosJson),
      };
      return unlocked ? applyUnlock(profile) : profile;
    }
  } catch (e) {
    console.warn("DB cache lookup failed:", e);
  }

  // 3. Source lookup — uses sample dataset, or generates a deterministic profile
  const profile = findOrGenerateProfile(handle);
  return unlocked ? applyUnlock(profile) : profile;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  const profile = await fetchProfileFromSource(handle);

  // Persist to DB cache (upsert) so subsequent lookups are instant
  try {
    const normalizedHandle = profile.handle.replace(/^@/, "").toLowerCase();
    await db.cachedProfile.upsert({
      where: { handle: normalizedHandle },
      create: {
        id: profile.id,
        handle: normalizedHandle,
        displayName: profile.displayName,
        avatarInitials: profile.avatarInitials,
        bio: profile.bio,
        url: profile.url,
        verified: profile.verified,
        region: profile.region,
        category: profile.category,
        accountAgeDays: profile.accountAgeDays,
        followers: profile.metrics.followers,
        following: profile.metrics.following,
        likes: profile.metrics.likes,
        videos: profile.metrics.videos,
        engagementRate: profile.engagementRate,
        avgViewsPerVideo: profile.avgViewsPerVideo,
        monetizationEligible: profile.monetizationEligible,
        checksJson: JSON.stringify(profile.checks),
        recentVideosJson: JSON.stringify(profile.recentVideos),
      },
      update: {
        fetchedAt: new Date(),
        followers: profile.metrics.followers,
        likes: profile.metrics.likes,
        videos: profile.metrics.videos,
        monetizationEligible: profile.monetizationEligible,
        checksJson: JSON.stringify(profile.checks),
      },
    });
  } catch (e) {
    console.warn("DB cache write failed:", e);
  }

  return NextResponse.json({ profile });
}
