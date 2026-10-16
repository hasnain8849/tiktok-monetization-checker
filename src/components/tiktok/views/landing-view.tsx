"use client";

import * as React from "react";
import {
  Search,
  Heart,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Users,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TikTokMark } from "@/components/tiktok/top-bar";
import {
  findProfile,
  formatCount,
  sampleSearches,
  type Profile,
} from "@/lib/tiktok-data";

interface LandingViewProps {
  onCheck: (handle: string) => void;
  onSeeResults: (p: Profile) => void;
  onGoDashboard: () => void;
}

export function LandingView({ onCheck, onSeeResults, onGoDashboard }: LandingViewProps) {
  const [tab, setTab] = React.useState<"username" | "url">("username");
  const [value, setValue] = React.useState("@mrbeast");
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const submit = () => {
    const v = value.trim();
    if (!v) {
      toast({ title: "Enter a username", description: "Please type a TikTok handle or profile URL.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const p = findProfile(v);
      setLoading(false);
      if (p) onSeeResults(p);
      else {
        toast({
          title: "Profile not found",
          description: `No demo profile matches "${v}". Try @mrbeast, @charlidamelio, @artbyjordan, or @prankzlife.`,
          variant: "destructive",
        });
      }
    }, 1100);
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: heading + input */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                  Check Your <span className="text-white">TikTok</span>
                  <br />
                  <span className="gradient-text-hero">Monetization Eligibility</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl font-normal leading-relaxed">
                  Enter your TikTok username or profile URL to check your followers, likes, and monetization possibility.
                </p>
              </div>

              {/* Input card */}
              <div className="glass-panel p-6 rounded-2xl max-w-xl border border-slate-800 shadow-2xl relative">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setTab("username")}
                    className={
                      "px-5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all " +
                      (tab === "username"
                        ? "bg-[#00f2fe] text-slate-950 font-semibold shadow-sm"
                        : "bg-[#111C2E] hover:bg-[#182740] text-slate-400 hover:text-slate-200 border border-slate-800")
                    }
                  >
                    Username
                  </button>
                  <button
                    onClick={() => setTab("url")}
                    className={
                      "px-5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all " +
                      (tab === "url"
                        ? "bg-[#00f2fe] text-slate-950 font-semibold shadow-sm"
                        : "bg-[#111C2E] hover:bg-[#182740] text-slate-400 hover:text-slate-200 border border-slate-800")
                    }
                  >
                    Profile URL
                  </button>
                </div>
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder={tab === "username" ? "e.g. @mrbeast" : "https://www.tiktok.com/@mrbeast"}
                    className="glass-input-box text-slate-100 placeholder-slate-500 text-sm sm:text-base rounded-xl px-4 py-3.5 h-12 border-0 focus-visible:ring-2 focus-visible:ring-[#00f2fe]"
                  />
                  <Button
                    onClick={submit}
                    disabled={loading}
                    className="w-full gradient-btn-primary text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg transition-transform active:scale-[0.99] h-12 border-0 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Check Monetization</span>
                      </>
                    )}
                  </Button>
                </div>
                {/* Quick samples */}
                <div className="mt-3 flex flex-wrap gap-1.5">
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

              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live TikTok Creator Rewards Program algorithm updated for 2026 criteria
              </p>
            </div>

            {/* Right: phone mockup */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <div className="absolute -top-6 -right-6 w-64 h-64 bg-cyan-500/20 rounded-full filter blur-3xl pointer-events-none" />
              <div className="relative w-[285px] sm:w-[315px] h-[580px] bg-[#0c121e] rounded-[44px] border-4 border-slate-700/60 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xl"
                   style={{ boxShadow: "0 0 0 8px #182337, 0 20px 45px -10px rgba(0,0,0,0.8)" }}>
                <div className="w-24 h-4 bg-slate-900 mx-auto rounded-full mb-3 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-black/60 mr-2" />
                  <div className="w-2 h-2 rounded-full bg-blue-950" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-3 text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#03060c] border border-slate-800 flex items-center justify-center shadow-lg shadow-cyan-500/10 mb-2">
                    <div className="scale-150"><TikTokMark /></div>
                  </div>
                  <h3 className="text-base font-bold tracking-wider text-white">TikTok</h3>
                  <div className="w-full bg-[#111A29]/90 border border-cyan-500/30 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-md transition hover:border-cyan-400">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Real Followers</p>
                      <p className="text-lg font-bold text-white tracking-tight">1.2M</p>
                    </div>
                  </div>
                  <div className="w-full bg-[#111A29]/90 border border-[#fe2c55]/30 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-md transition hover:border-[#fe2c55]">
                    <div className="w-10 h-10 rounded-xl bg-[#fe2c55]/15 flex items-center justify-center text-[#fe2c55] shrink-0">
                      <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Likes</p>
                      <p className="text-lg font-bold text-white tracking-tight">28.5M</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Monetization Ready</span>
                  </div>
                </div>
                <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="border-y border-slate-800/80 bg-[#080E1A]/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, color: "text-cyan-400", label: "Check Followers" },
              { icon: Heart, color: "text-[#fe2c55]", label: "Check Likes" },
              { icon: ShieldCheck, color: "text-cyan-400", label: "Monetization Eligibility" },
              { icon: Lock, color: "text-[#fe2c55]", label: "Fast & Secure" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex flex-col items-center justify-center gap-2 group p-2">
                  <div className={`${f.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo result preview */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
              Live Result Demo
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Instant Creator Audit & Verification
            </h2>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-10 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-bold flex items-center justify-center text-xs">1</span>
              <span>Enter Profile</span>
            </div>
            <div className="w-6 sm:w-12 h-[1px] bg-cyan-500/40" />
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-bold flex items-center justify-center text-xs">2</span>
              <span>Fetch Data</span>
            </div>
            <div className="w-6 sm:w-12 h-[1px] bg-cyan-500/40" />
            <div className="flex items-center gap-2 text-white">
              <span className="w-6 h-6 rounded-full border border-cyan-400 text-cyan-400 font-bold flex items-center justify-center text-xs">3</span>
              <span>Results</span>
            </div>
          </div>

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
                    MB
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white">@mrbeast</h4>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-current" />
                  </div>
                  <p className="text-xs text-cyan-400 hover:underline cursor-pointer">
                    https://www.tiktok.com/@mrbeast
                  </p>
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
                { label: "Followers", value: "120.4M", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                { label: "Following", value: "608", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Total Likes", value: "2.8B", icon: Heart, color: "text-[#fe2c55]", bg: "bg-[#fe2c55]/10" },
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

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-start sm:items-center gap-3.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400/90 font-medium uppercase tracking-wide">
                    Monetization Eligibility
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                    Eligible
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Your account meets the basic requirements for TikTok monetization.
                </p>
              </div>
            </div>

            <Button
              onClick={() => onSeeResults(findProfile("@mrbeast")!)}
              className="w-full gradient-btn-primary text-white font-semibold py-3.5 px-6 rounded-xl text-center shadow-lg hover:shadow-pink-500/20 transition-all h-12 border-0"
            >
              <PlayCircle className="w-4 h-4" />
              See full audit
            </Button>
          </div>
        </div>
      </section>

      {/* CTA to dashboard */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-panel rounded-2xl border border-slate-700/60 p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Track your progress over time
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Save profiles, monitor your growth, and get alerts when your account crosses monetization thresholds.
            </p>
            <Button
              onClick={onGoDashboard}
              className="gradient-btn-primary text-white font-semibold px-7 py-3 rounded-full shadow-lg border-0 h-12"
            >
              Open Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
