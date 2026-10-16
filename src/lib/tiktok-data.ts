// Mock data for the TikTok Monetization Checker.
// Represents profiles fetched from TikTok + eligibility audit results.

export interface ProfileMetric {
  followers: number;
  following: number;
  likes: number;
  videos: number;
}

export interface EligibilityCheck {
  key: string;
  label: string;
  requirement: string;
  actual: string;
  passed: boolean;
}

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  avatarInitials: string;
  bio: string;
  url: string;
  verified: boolean;
  monetizationEligible: boolean;
  metrics: ProfileMetric;
  checks: EligibilityCheck[];
  accountAgeDays: number;
  region: string;
  category: string;
  engagementRate: number; // percentage
  avgViewsPerVideo: number;
  recentVideos: { id: string; title: string; views: number; likes: number; postedDaysAgo: number }[];
}

export const eligibilityRequirements = [
  { key: "followers", label: "Followers", requirement: "≥ 10,000" },
  { key: "likes", label: "Total likes", requirement: "≥ 100,000" },
  { key: "age", label: "Account age", requirement: "≥ 30 days" },
  { key: "guidelines", label: "Community guidelines", requirement: "No violations" },
  { key: "region", label: "Eligible region", requirement: "Supported country" },
  { key: "videos", label: "Original videos", requirement: "≥ 3 in last 30 days" },
];

const sampleProfiles: Profile[] = [
  {
    id: "p_mrbeast",
    handle: "@mrbeast",
    displayName: "MrBeast",
    avatarInitials: "MB",
    bio: "I make videos and give away money.",
    url: "https://www.tiktok.com/@mrbeast",
    verified: true,
    monetizationEligible: true,
    metrics: {
      followers: 120_400_000,
      following: 608,
      likes: 2_800_000_000,
      videos: 412,
    },
    checks: [
      { key: "followers", label: "Followers (≥ 10,000)", requirement: "≥ 10,000", actual: "120.4M", passed: true },
      { key: "likes", label: "Total likes (≥ 100,000)", requirement: "≥ 100,000", actual: "2.8B", passed: true },
      { key: "age", label: "Account age (≥ 30 days)", requirement: "≥ 30 days", actual: "5+ years", passed: true },
      { key: "guidelines", label: "Community guidelines", requirement: "No violations", actual: "Clean", passed: true },
      { key: "region", label: "Eligible region", requirement: "Supported country", actual: "US", passed: true },
      { key: "videos", label: "Original videos (≥ 3 in last 30 days)", requirement: "≥ 3", actual: "12", passed: true },
    ],
    accountAgeDays: 1900,
    region: "United States",
    category: "Entertainment / Philanthropy",
    engagementRate: 8.4,
    avgViewsPerVideo: 18_400_000,
    recentVideos: [
      { id: "v1", title: "$100k to anyone who can eat this", views: 42_300_000, likes: 6_800_000, postedDaysAgo: 4 },
      { id: "v2", title: "Last to leave circle wins", views: 28_100_000, likes: 4_200_000, postedDaysAgo: 9 },
      { id: "v3", title: "I built 100 wells", views: 35_900_000, likes: 5_100_000, postedDaysAgo: 15 },
    ],
  },
  {
    id: "p_charli",
    handle: "@charlidamelio",
    displayName: "charli d'amelio",
    avatarInitials: "CD",
    bio: "dancer · natalie's sister",
    url: "https://www.tiktok.com/@charlidamelio",
    verified: true,
    monetizationEligible: true,
    metrics: { followers: 155_300_000, following: 1240, likes: 12_900_000_000, videos: 3200 },
    checks: [
      { key: "followers", label: "Followers (≥ 10,000)", requirement: "≥ 10,000", actual: "155.3M", passed: true },
      { key: "likes", label: "Total likes (≥ 100,000)", requirement: "≥ 100,000", actual: "12.9B", passed: true },
      { key: "age", label: "Account age (≥ 30 days)", requirement: "≥ 30 days", actual: "6+ years", passed: true },
      { key: "guidelines", label: "Community guidelines", requirement: "No violations", actual: "Clean", passed: true },
      { key: "region", label: "Eligible region", requirement: "Supported country", actual: "US", passed: true },
      { key: "videos", label: "Original videos (≥ 3 in last 30 days)", requirement: "≥ 3", actual: "28", passed: true },
    ],
    accountAgeDays: 2200,
    region: "United States",
    category: "Dance / Lifestyle",
    engagementRate: 5.6,
    avgViewsPerVideo: 3_200_000,
    recentVideos: [
      { id: "v1", title: "spring recital 🌷", views: 8_400_000, likes: 1_900_000, postedDaysAgo: 2 },
      { id: "v2", title: "tutorial: shake transition", views: 5_100_000, likes: 920_000, postedDaysAgo: 7 },
      { id: "v3", title: "dance battle w/ dixie", views: 6_800_000, likes: 1_300_000, postedDaysAgo: 11 },
    ],
  },
  {
    id: "p_smallcreator",
    handle: "@artbyjordan",
    displayName: "Jordan Draws",
    avatarInitials: "JD",
    bio: "daily digital art · commissions open",
    url: "https://www.tiktok.com/@artbyjordan",
    verified: false,
    monetizationEligible: false,
    metrics: { followers: 8_400, following: 312, likes: 142_000, videos: 87 },
    checks: [
      { key: "followers", label: "Followers (≥ 10,000)", requirement: "≥ 10,000", actual: "8,400", passed: false },
      { key: "likes", label: "Total likes (≥ 100,000)", requirement: "≥ 100,000", actual: "142K", passed: true },
      { key: "age", label: "Account age (≥ 30 days)", requirement: "≥ 30 days", actual: "47 days", passed: true },
      { key: "guidelines", label: "Community guidelines", requirement: "No violations", actual: "Clean", passed: true },
      { key: "region", label: "Eligible region", requirement: "Supported country", actual: "UK", passed: true },
      { key: "videos", label: "Original videos (≥ 3 in last 30 days)", requirement: "≥ 3", actual: "5", passed: true },
    ],
    accountAgeDays: 47,
    region: "United Kingdom",
    category: "Art / Illustration",
    engagementRate: 11.2,
    avgViewsPerVideo: 18_400,
    recentVideos: [
      { id: "v1", title: "drawing for 100 days straight", views: 42_300, likes: 8_400, postedDaysAgo: 1 },
      { id: "v2", title: "first commission timelapse", views: 28_100, likes: 5_900, postedDaysAgo: 6 },
      { id: "v3", title: "tools i actually use", views: 51_700, likes: 11_200, postedDaysAgo: 12 },
    ],
  },
  {
    id: "p_restricted",
    handle: "@prankzlife",
    displayName: "Prankz Life",
    avatarInitials: "PL",
    bio: "epic pranks daily · DM for collabs",
    url: "https://www.tiktok.com/@prankzlife",
    verified: false,
    monetizationEligible: false,
    metrics: { followers: 89_200, following: 287, likes: 1_400_000, videos: 220 },
    checks: [
      { key: "followers", label: "Followers (≥ 10,000)", requirement: "≥ 10,000", actual: "89.2K", passed: true },
      { key: "likes", label: "Total likes (≥ 100,000)", requirement: "≥ 100,000", actual: "1.4M", passed: true },
      { key: "age", label: "Account age (≥ 30 days)", requirement: "≥ 30 days", actual: "1 year", passed: true },
      { key: "guidelines", label: "Community guidelines", requirement: "No violations", actual: "Restricted", passed: false },
      { key: "region", label: "Eligible region", requirement: "Supported country", actual: "US", passed: true },
      { key: "videos", label: "Original videos (≥ 3 in last 30 days)", requirement: "≥ 3", actual: "2", passed: false },
    ],
    accountAgeDays: 380,
    region: "United States",
    category: "Pranks",
    engagementRate: 3.1,
    avgViewsPerVideo: 24_500,
    recentVideos: [
      { id: "v1", title: "epic bathroom prank 🚽", views: 198_000, likes: 21_400, postedDaysAgo: 12 },
      { id: "v2", title: "what happens when you...", views: 142_000, likes: 14_900, postedDaysAgo: 28 },
    ],
  },
];

export function findProfile(handle: string): Profile | null {
  const normalized = handle.trim().toLowerCase().replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\//, "").replace(/[@/]/g, "");
  return sampleProfiles.find((p) => p.handle.toLowerCase().replace(/^@/, "") === normalized) || null;
}

// Deterministic pseudo-profile generator — synthesizes a believable TikTok
// profile for any handle that isn't in our sample dataset. The same handle
// always produces the same profile (so users can re-check and see stable
// numbers), and ~80% of generated profiles pass eligibility so the demo
// still works on arbitrary inputs.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}
function range(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1));
}

export function generateProfile(handle: string): Profile {
  const clean = handle.trim().toLowerCase().replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\//, "").replace(/[@/]/g, "");
  const h = hashStr(clean || "anonymous");
  const displayName = clean.charAt(0).toUpperCase() + clean.slice(1) || "Anonymous";
  const initials = (clean.slice(0, 2) || "AA").toUpperCase();

  // Most random handles are eligible; ~1 in 7 is restricted.
  const outcomeKind = h % 7;
  const restricted = outcomeKind === 0;
  const ineligible = outcomeKind === 1;

  const followers = restricted
    ? range(h >> 2, 30_000, 250_000)
    : ineligible
      ? range(h >> 3, 500, 9_500)
      : range(h >> 4, 12_000, 1_200_000) * (h % 3 === 0 ? 8 : 1);
  const likes = Math.floor(Math.max(0, followers) * (8 + (h % 20)));
  const videos = range(h >> 5, 12, 480);
  const following = range(h >> 6, 80, 2400);

  const regions = ["United States", "United Kingdom", "Brazil", "Germany", "Mexico", "Indonesia", "Philippines"];
  const categories = ["Dance / Lifestyle", "Comedy", "Art / Illustration", "Gaming", "Music", "Education", "Food & Cooking", "Fitness", "Travel"];

  const baseChecks: EligibilityCheck[] = [
    {
      key: "followers",
      label: "Followers (≥ 10,000)",
      requirement: "≥ 10,000",
      actual: formatCount(followers),
      passed: followers >= 10_000,
    },
    {
      key: "likes",
      label: "Total likes (≥ 100,000)",
      requirement: "≥ 100,000",
      actual: formatCount(likes),
      passed: likes >= 100_000,
    },
    {
      key: "age",
      label: "Account age (≥ 30 days)",
      requirement: "≥ 30 days",
      actual: `${range(h >> 7, 20, 1500)} days`,
      passed: (h >> 7) % 7 !== 0,
    },
    {
      key: "guidelines",
      label: "Community guidelines",
      requirement: "No violations",
      actual: restricted ? "Restricted" : "Clean",
      passed: !restricted,
    },
    {
      key: "region",
      label: "Eligible region",
      requirement: "Supported country",
      actual: pick(regions, h >> 8),
      passed: true,
    },
    {
      key: "videos",
      label: "Original videos (≥ 3 in last 30 days)",
      requirement: "≥ 3",
      actual: `${range(h >> 9, 0, 28)}`,
      passed: (h >> 9) % 5 !== 0,
    },
  ];

  const allPassed = baseChecks.every((c) => c.passed);

  return {
    id: `gen_${clean}`,
    handle: `@${clean}`,
    displayName,
    avatarInitials: initials,
    bio: `Generated profile for ${clean || "anonymous"} · demo data`,
    url: `https://www.tiktok.com/@${clean}`,
    verified: !restricted && followers > 1_000_000,
    monetizationEligible: allPassed,
    metrics: { followers, following, likes, videos },
    checks: baseChecks,
    accountAgeDays: range(h >> 7, 20, 1500),
    region: pick(regions, h >> 8),
    category: pick(categories, h >> 10),
    engagementRate: Number((2 + (h % 150) / 10).toFixed(1)),
    avgViewsPerVideo: Math.floor(followers * (0.05 + (h % 30) / 100)),
    recentVideos: Array.from({ length: 3 }, (_, i) => {
      const vViews = Math.max(0, Math.floor(followers * (0.02 + (h % 20) / 100)) - i * 1000);
      const vLikes = Math.max(0, Math.floor((likes / Math.max(1, videos)) * 0.5) - i * 100);
      return {
        id: `gen_${clean}_v${i}`,
        title: ["first post this week", "throwback to last month", "tutorial: easy transition"][i],
        views: vViews,
        likes: vLikes,
        postedDaysAgo: (i + 1) * 3 + (h % 4),
      };
    }),
  };
}

// Find a profile from the sample dataset, or generate one if not found.
// Used by the API route to support arbitrary TikTok handle inputs.
export function findOrGenerateProfile(handle: string): Profile {
  return findProfile(handle) ?? generateProfile(handle);
}

export const sampleSearches = [
  "@mrbeast",
  "@charlidamelio",
  "@artbyjordan",
  "@prankzlife",
];

export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

// Dashboard "saved checks" history
export interface DashboardCheck {
  id: string;
  handle: string;
  avatarInitials: string;
  checkedAt: string; // ISO
  followers: number;
  eligible: boolean;
  status: "eligible" | "ineligible" | "restricted";
}

export const dashboardChecks: DashboardCheck[] = [
  { id: "c1", handle: "@mrbeast", avatarInitials: "MB", checkedAt: "2026-10-15T13:42:00", followers: 120_400_000, eligible: true, status: "eligible" },
  { id: "c2", handle: "@charlidamelio", avatarInitials: "CD", checkedAt: "2026-10-14T09:18:00", followers: 155_300_000, eligible: true, status: "eligible" },
  { id: "c3", handle: "@artbyjordan", avatarInitials: "JD", checkedAt: "2026-10-13T22:05:00", followers: 8_400, eligible: false, status: "ineligible" },
  { id: "c4", handle: "@prankzlife", avatarInitials: "PL", checkedAt: "2026-10-13T14:50:00", followers: 89_200, eligible: false, status: "restricted" },
  { id: "c5", handle: "@khaby.lame", avatarInitials: "KL", checkedAt: "2026-10-12T18:22:00", followers: 162_500_000, eligible: true, status: "eligible" },
  { id: "c6", handle: "@bellapoarch", avatarInitials: "BP", checkedAt: "2026-10-11T20:14:00", followers: 94_200_000, eligible: true, status: "eligible" },
];

export const dashboardStats = {
  totalChecks: 12_400,
  eligible: 8_742,
  ineligible: 3_140,
  restricted: 518,
  savedProfiles: 6,
  avgFollowersOfEligible: 1_200_000,
};
