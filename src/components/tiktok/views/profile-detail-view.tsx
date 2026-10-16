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
  Lock,
  ShieldAlert,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TikTokMark } from "@/components/tiktok/top-bar";
import {
  formatCount,
  type Profile,
} from "@/lib/tiktok-data";
import { cn } from "@/lib/utils";

interface ProfileDetailProps {
  profile: Profile;
  onBack: () => void;
  onApply: (p: Profile) => void;
  onUnlock: (p: Profile) => void;
  onShare?: (p: Profile) => void;
}

export function ProfileDetailView({ profile, onBack, onApply, onUnlock, onShare }: ProfileDetailProps) {
  const passedCount = profile.checks.filter((c) => c.passed).length;
  const allPassed = passedCount === profile.checks.length;
  const isRestricted = profile.checks.some(
    (c) => c.key === "guidelines" && !c.passed
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {onShare && (
        <div className="flex justify-end -mt-4">
          <button
            onClick={() => onShare(profile)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share audit
          </button>
        </div>
      )}

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
              {passedCount} of {profile.checks.length} checks passed
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
          <Separator className="bg-slate-800" />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isRestricted && (
              <Button
                onClick={() => onUnlock(profile)}
                className="font-semibold rounded-xl border-0 h-11 px-6 bg-gradient-to-r from-amber-500/30 to-red-500/30 border-amber-500/40 text-amber-200 hover:from-amber-500/40 hover:to-red-500/40"
              >
                <ShieldAlert className="w-4 h-4" />
                View restrictions & pay to unlock
              </Button>
            )}
            <Button
              onClick={() => onApply(profile)}
              disabled={!allPassed}
              className={cn(
                "font-semibold rounded-xl border-0 h-11 px-6",
                allPassed
                  ? "gradient-btn-primary text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Lock className="w-4 h-4" />
              {allPassed ? "Apply for Monetization" : "Resolve issues first"}
            </Button>
          </div>
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
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Account age</p>
                <p className="text-lg font-semibold text-white tabular-nums inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {profile.accountAgeDays} days
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Region</p>
                <p className="text-sm font-semibold text-white">{profile.region}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Recent videos
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
