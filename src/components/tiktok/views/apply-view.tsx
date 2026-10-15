"use client";

import * as React from "react";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/tiktok-data";

interface ApplyViewProps {
  profile: Profile;
  onBack: () => void;
  onApproved: () => void;
  onRestricted: () => void;
}

const steps = [
  { label: "Submitting application", icon: FileText, duration: 1200 },
  { label: "Verifying account age", icon: ShieldCheck, duration: 900 },
  { label: "Checking community guidelines", icon: ShieldCheck, duration: 1100 },
  { label: "Final approval", icon: CheckCircle2, duration: 700 },
];

export function ApplyView({ profile, onBack, onApproved, onRestricted }: ApplyViewProps) {
  const [progress, setProgress] = React.useState(0);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    let cancelled = false;
    let totalElapsed = 0;
    const totalDuration = steps.reduce((s, x) => s + x.duration, 0);

    const tick = () => {
      if (cancelled) return;
      totalElapsed += 100;
      const pct = Math.min(99, Math.round((totalElapsed / totalDuration) * 100));
      setProgress(pct);
      const cumulative = 0;
      let acc = 0;
      for (let i = 0; i < steps.length; i++) {
        acc += steps[i].duration;
        if (totalElapsed < acc) {
          setStepIdx(i);
          break;
        }
      }
      if (totalElapsed >= totalDuration) {
        setProgress(99);
        // Random outcome — 75% approve, 25% restrict; deterministic by handle for stability
        const isRestricted = profile.id === "p_restricted" || profile.handle === "@prankzlife";
        if (isRestricted) {
          setTimeout(() => {
            if (cancelled) return;
            setDone(true);
            toast({ title: "Application held", description: "Account flagged for review.", variant: "destructive" });
            onRestricted();
          }, 800);
        } else {
          setTimeout(() => {
            if (cancelled) return;
            setProgress(100);
            setDone(true);
            toast({ title: "Approved!", description: "Your monetization application was accepted." });
            onApproved();
          }, 800);
        }
        return;
      }
      setTimeout(tick, 100);
    };
    const t = setTimeout(tick, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-2 text-center">
        <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
          Monetization Application
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Applying for <span className="gradient-text-hero">{profile.handle}</span>
        </h1>
        <p className="text-slate-400">
          Reviewing your application against TikTok Creator Rewards criteria.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 p-8 space-y-8 shadow-2xl">
        {/* Big progress */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-[#00f2fe]/30 to-[#fe2c55]/30 border border-slate-700 flex items-center justify-center">
              {done ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              ) : (
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-5xl font-bold tabular-nums text-white">
              {progress}%
            </p>
            <p className="text-sm text-slate-400">
              {!done ? steps[stepIdx].label : "Complete"}
            </p>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-[#00f2fe] [&>div]:to-[#fe2c55]"
          />
        </div>

        {/* Step list */}
        <ul className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const stepComplete = i < stepIdx || done;
            const stepCurrent = i === stepIdx && !done;
            return (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <div
                  className={
                    "h-8 w-8 rounded-full flex items-center justify-center border " +
                    (stepComplete
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : stepCurrent
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 animate-pulse"
                        : "bg-slate-800 border-slate-700 text-slate-500")
                  }
                >
                  {stepComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stepCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={stepComplete ? "text-slate-400 line-through" : stepCurrent ? "text-cyan-300 font-medium" : "text-slate-500"}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Hidden submit form for completeness */}
        <form className="hidden" onSubmit={(e) => e.preventDefault()}>
          <Button type="submit">
            <Send className="w-4 h-4" />
            Submit
          </Button>
        </form>
      </div>

      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        Application encrypted end-to-end. We never store your password.
      </p>
    </div>
  );
}
