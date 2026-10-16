"use client";

import * as React from "react";
import {
  Search,
  Heart,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TikTokMark } from "@/components/tiktok/top-bar";
import {
  formatCount,
  sampleSearches,
  type Profile,
} from "@/lib/tiktok-data";
import { cn } from "@/lib/utils";

interface CheckerViewProps {
  initialHandle: string;
  onBack: () => void;
  onResult: (p: Profile) => void;
  onApply: (p: Profile) => void;
}

type Stage = "idle" | "fetching" | "auditing" | "done" | "not-found";

const fetchingSteps = [
  "Resolving handle",
  "Fetching profile metadata",
  "Counting followers & likes",
  "Auditing community guidelines",
  "Finalizing eligibility verdict",
];

export function CheckerView({ initialHandle, onBack, onResult, onApply }: CheckerViewProps) {
  const [value, setValue] = React.useState(initialHandle || "@mrbeast");
  const [stage, setStage] = React.useState<Stage>("idle");
  const [stepIdx, setStepIdx] = React.useState(0);
  const [resultProfile, setResultProfile] = React.useState<Profile | null>(null);
  const { toast } = useToast();

  const run = async () => {
    const v = value.trim();
    if (!v) {
      toast({ title: "Enter a username", description: "Please type a TikTok handle.", variant: "destructive" });
      return;
    }
    setStage("fetching");
    setStepIdx(0);
    const id = setInterval(() => {
      setStepIdx((i) => {
        if (i >= fetchingSteps.length - 1) {
          clearInterval(id);
          return i;
        }
        return i + 1;
      });
    }, 450);

    // Call the backend API in parallel with the animated fetch steps.
    // The API route persists the profile to the Prisma DB cache and
    // (later) saves the audit row.
    const minDelay = new Promise<void>((res) =>
      setTimeout(res, fetchingSteps.length * 450 + 200)
    );

    try {
      const respPromise = fetch(
        `/api/profiles/${encodeURIComponent(v)}`,
        { headers: { Accept: "application/json" } }
      );
      const [resp] = await Promise.all([respPromise, minDelay]);
      clearInterval(id);

      if (resp.status === 404) {
        setStage("not-found");
        toast({
          title: "Profile not found",
          description: `No demo profile matches "${v}". Try @mrbeast, @charlidamelio, @artbyjordan, or @prankzlife.`,
          variant: "destructive",
        });
        return;
      }
      if (!resp.ok) {
        throw new Error(`API error ${resp.status}`);
      }
      const data = (await resp.json()) as { profile: Profile };
      const p = data.profile;

      // Persist the audit row to /api/audits (fire-and-forget).
      const passedCount = p.checks.filter((c) => c.passed).length;
      const allPassed = passedCount === p.checks.length;
      const status: "eligible" | "ineligible" | "restricted" = allPassed
        ? "eligible"
        : p.checks.some((c) => c.actual === "Restricted")
          ? "restricted"
          : "ineligible";
      fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: p.handle,
          avatarInitials: p.avatarInitials,
          followers: p.metrics.followers,
          eligible: allPassed,
          status,
          checksPassed: passedCount,
          checksTotal: p.checks.length,
        }),
      }).catch((err) => console.warn("audit save failed:", err));

      setStage("auditing");
      setTimeout(() => {
        setStage("done");
        setResultProfile(p);
        onResult(p);
      }, 800);
    } catch (e) {
      clearInterval(id);
      console.error(e);
      setStage("not-found");
      toast({
        title: "Lookup failed",
        description: "Could not reach the audit service. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </button>

      <div className="space-y-2 text-center">
        <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
          Profile Checker
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Audit any TikTok profile
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Live fetch of followers, likes, and a six-point eligibility audit against the 2026 Creator Rewards criteria.
        </p>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && stage !== "fetching" && stage !== "auditing" && run()}
            placeholder="@username or https://www.tiktok.com/@username"
            className="glass-input-box text-slate-100 placeholder-slate-500 text-base rounded-xl pl-10 pr-4 py-3.5 border-0 focus-visible:ring-2 focus-visible:ring-[#00f2fe]"
          />
        </div>
        <Button
          onClick={run}
          disabled={stage === "fetching" || stage === "auditing"}
          className="w-full gradient-btn-primary text-white font-semibold py-3.5 rounded-xl shadow-lg border-0 h-12"
        >
          {stage === "fetching" || stage === "auditing" ? (
            <>
              <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Auditing profile...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run eligibility audit
            </>
          )}
        </Button>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">Try:</span>
          {sampleSearches.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800/60 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Progress steps */}
      {(stage === "fetching" || stage === "auditing") && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <div className="h-4 w-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span className="font-medium">{stage === "fetching" ? "Fetching data" : "Auditing guidelines"}</span>
          </div>
          <ul className="space-y-2.5">
            {fetchingSteps.map((s, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx && stage === "fetching";
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      done
                        ? "bg-emerald-500/20 text-emerald-400"
                        : current
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-slate-500"
                    )}
                  >
                    {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={done ? "text-slate-300 line-through" : current ? "text-cyan-300" : "text-slate-500"}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00f2fe] to-[#fe2c55] transition-all duration-500"
              style={{ width: `${((stepIdx + 1) / fetchingSteps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Result card */}
      {(stage === "done" || stage === "not-found") && (
        <ResultCard
          profile={stage === "done" ? resultProfile : null}
          onApply={onApply}
          onRecheck={run}
        />
      )}
    </div>
  );
}

function ResultCard({
  profile,
  onApply,
  onRecheck,
}: {
  profile: Profile | null;
  onApply: (p: Profile) => void;
  onRecheck: () => void;
}) {
  if (!profile) {
    return (
      <div className="glass-panel rounded-2xl border border-red-500/40 p-8 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Profile not found</h3>
        <p className="text-slate-400 text-sm">
          Try one of the demo handles — @mrbeast, @charlidamelio, @artbyjordan, or @prankzlife.
        </p>
        <Button onClick={onRecheck} variant="outline" className="border-slate-700">
          Try again
        </Button>
      </div>
    );
  }
  const passedCount = profile.checks.filter((c) => c.passed).length;
  const allPassed = passedCount === profile.checks.length;
  return (
    <div className="glass-panel rounded-2xl border border-slate-700/60 p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <h3 className="text-base sm:text-lg font-bold text-white">TikTok Profile Information</h3>
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
          Audit Status: Complete
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-lg text-white">
              {profile.avatarInitials}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-white">{profile.handle}</h4>
              {profile.verified && <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-current" />}
            </div>
            <a href={profile.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              {profile.url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <TikTokMark />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Followers", value: formatCount(profile.metrics.followers), icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Following", value: profile.metrics.following.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total Likes", value: formatCount(profile.metrics.likes), icon: Heart, color: "text-[#fe2c55]", bg: "bg-[#fe2c55]/10" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#09111D] border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className={`${m.color} p-2 ${m.bg} rounded-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{m.label}</span>
                <span className="text-lg font-bold text-white">{m.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "rounded-xl p-4 flex items-start sm:items-center gap-3.5",
          allPassed
            ? "bg-emerald-950/30 border border-emerald-500/30"
            : profile.checks.some((c) => c.actual === "Restricted")
              ? "bg-red-950/30 border border-red-500/30"
              : "bg-amber-950/30 border border-amber-500/30"
        )}
      >
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            allPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          )}
        >
          {allPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                allPassed ? "text-emerald-400/90" : "text-red-400/90"
              )}
            >
              Monetization Eligibility
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-bold border-0",
                allPassed
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              )}
            >
              {allPassed ? "Eligible" : "Not Eligible"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {allPassed
              ? "Your account meets the basic requirements for TikTok monetization."
              : "Your account does not meet all requirements. See the checklist below."}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Requirements Status ({passedCount}/{profile.checks.length} passed)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs sm:text-sm">
          {profile.checks.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-slate-300">
                {c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                {c.label}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  c.passed ? "text-emerald-400" : "text-red-400"
                )}
              >
                {c.passed ? "✓" : "✗"} {c.actual}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onApply(profile)}
        disabled={!allPassed}
        className={cn(
          "w-full font-semibold py-3.5 px-6 rounded-xl text-center shadow-lg transition-all border-0 h-12",
          allPassed
            ? "gradient-btn-primary text-white hover:shadow-pink-500/20"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        )}
      >
        {allPassed ? "Apply for Monetization" : "Resolve issues to apply"}
      </Button>
    </div>
  );
}
