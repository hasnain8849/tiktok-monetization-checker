"use client";

import * as React from "react";
import {
  ArrowLeft,
  Users,
  Heart,
  Video,
  MapPin,
  Tag,
  TrendingUp,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Play,
  Share2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TikTokMark } from "@/components/tiktok/top-bar";
import { formatCount, type EligibilityCheck } from "@/lib/tiktok-data";
import { cn } from "@/lib/utils";

interface SharedProfileViewProps {
  token: string;
  onBack: () => void;
}

interface SnapshotData {
  handle: string;
  displayName: string;
  avatarInitials: string;
  bio: string;
  url: string;
  verified: boolean;
  monetizationEligible: boolean;
  region: string;
  category: string;
  metrics: { followers: number; following: number; likes: number; videos: number };
  checks: EligibilityCheck[];
  engagementRate: number;
  avgViewsPerVideo: number;
  recentVideos: { id: string; title: string; views: number; likes: number; postedDaysAgo: number }[];
  snapshotAt: string;
}

interface ShareResponse {
  handle: string;
  snapshot: SnapshotData;
  createdAt: string;
  expiresAt: string | null;
}

export function SharedProfileView({ token, onBack }: SharedProfileViewProps) {
  const [data, setData] = React.useState<ShareResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/share/${token}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 404) throw new Error("Share link not found — it may have been revoked.");
        if (r.status === 410) throw new Error("This share link has expired.");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as ShareResponse;
      })
      .then((d) => setData(d))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading shared audit...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h1 className="text-xl font-bold text-white">Share link unavailable</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>
      </div>
    );
  }

  if (!data) return null;
  const profile = data.snapshot;
  const passedCount = profile.checks.filter((c) => c.passed).length;
  const allPassed = passedCount === profile.checks.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Share2 className="w-3.5 h-3.5" />
          Shared audit · snapshot from{" "}
          {new Date(data.snapshot.snapshotAt).toLocaleString("en-US")}
          {data.expiresAt && (
            <span className="ml-1">
              · expires {new Date(data.expiresAt).toLocaleDateString("en-US")}
            </span>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      <div className="rounded-md border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-300 flex items-center gap-2">
        <Share2 className="w-3.5 h-3.5" />
        This is a public, read-only view of an audit snapshot. The data shown
        was captured at the snapshot time and may not reflect the profile&apos;s
        current state.
      </div>

      {/* Header */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-500 to-[#fe2c55] p-[2px] shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center font-bold text-3xl text-white">
              {profile.avatarInitials}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{profile.handle}</h1>
              {profile.verified && <CheckCircle2 className="w-5 h-5 text-cyan-400 fill-current" />}
              <Badge
                variant="outline"
                className={cn(
                  "border-0",
                  allPassed
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                )}
              >
                {allPassed ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
            <p className="text-slate-400">{profile.bio}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <a href={profile.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">
                {profile.url} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {profile.region}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag className="w-3 h-3" /> {profile.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Followers", value: formatCount(profile.metrics.followers), icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Following", value: profile.metrics.following.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total Likes", value: formatCount(profile.metrics.likes), icon: Heart, color: "text-[#fe2c55]", bg: "bg-[#fe2c55]/10" },
          { label: "Videos", value: profile.metrics.videos.toLocaleString(), icon: Video, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.bg, m.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="mt-3 text-xs text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Eligibility checklist */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Eligibility Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {passedCount} of {profile.checks.length} checks passed (at snapshot time)
            </p>
          </div>
          <ul className="space-y-2.5">
            {profile.checks.map((c) => (
              <li
                key={c.key}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  c.passed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                )}
              >
                {c.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{c.label}</p>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums whitespace-nowrap",
                        c.passed ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {c.passed ? "✓" : "✗"} {c.actual}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requirement: {c.requirement}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Profile meta + recent videos */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <TikTokMark />
              <span className="font-semibold text-white">Profile insights</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Engagement</p>
                <p className="text-lg font-semibold text-cyan-400 tabular-nums">
                  {profile.engagementRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Avg views</p>
                <p className="text-lg font-semibold text-white tabular-nums">
                  {formatCount(profile.avgViewsPerVideo)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Recent videos (snapshot)
            </p>
            <ul className="space-y-3">
              {profile.recentVideos.map((v) => (
                <li key={v.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{v.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatCount(v.views)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatCount(v.likes)}
                      </span>
                      <span>· {v.postedDaysAgo}d ago</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
