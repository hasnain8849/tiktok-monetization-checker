import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  findProfile,
  type Profile,
  type EligibilityCheck,
} from "@/lib/tiktok-data";

// In a real app this would scrape TikTok or call a 3rd-party API.
// Here we look up our mock dataset first, then fall back to the DB cache.
async function fetchProfileFromSource(handle: string): Promise<Profile | null> {
  // 1. Try DB cache first (fast path for re-checks)
  const normalized = handle.trim().toLowerCase().replace(/^@/, "");
  try {
    const cached = await db.cachedProfile.findUnique({
      where: { handle: normalized },
    });
    if (cached && Date.now() - cached.fetchedAt.getTime() < 1000 * 60 * 60) {
      // Cache valid for 1 hour
      return {
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
    }
  } catch (e) {
    // DB may not be ready; fall through to source.
    console.warn("DB cache lookup failed:", e);
  }

  // 2. Source lookup — in production this would be TikTok's API or a scraper
  return findProfile(handle);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);

  const profile = await fetchProfileFromSource(handle);

  if (!profile) {
    return NextResponse.json(
      {
        error: "Profile not found",
        message: `No TikTok profile matches "${handle}". Try @mrbeast, @charlidamelio, @artbyjordan, or @prankzlife.`,
      },
      { status: 404 }
    );
  }

  // Persist to DB cache (upsert) so subsequent lookups are instant
  try {
    await db.cachedProfile.upsert({
      where: { handle: profile.handle.replace(/^@/, "").toLowerCase() },
      create: {
        id: profile.id,
        handle: profile.handle.replace(/^@/, "").toLowerCase(),
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
