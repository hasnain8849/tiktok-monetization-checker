"use client";

import * as React from "react";
import { AlertTriangle, X, RefreshCw, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/tiktok-data";

interface RestrictedViewProps {
  profile: Profile;
  onBack: () => void;
  onRecheck: () => void;
}

export function RestrictedView({ profile, onBack, onRecheck }: RestrictedViewProps) {
  const failedChecks = profile.checks.filter((c) => !c.passed);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg">
        {/* Backdrop pulse */}
        <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative glass-panel rounded-2xl border border-red-500/40 shadow-2xl overflow-hidden">
          {/* Top warning band */}
          <div className="bg-red-500/15 border-b border-red-500/30 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Account Restricted</h2>
                <p className="text-xs text-red-300">
                  Application for {profile.handle} could not be completed
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-300 leading-relaxed">
              Our automated review found issues that prevent your account from being
              approved for monetization at this time. Please resolve the items below
              and try again.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Issues found
              </p>
              <ul className="space-y-2">
                {failedChecks.map((c) => (
                  <li
                    key={c.key}
                    className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{c.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Required: {c.requirement} · Current: <span className="text-red-300">{c.actual}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                How to fix
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Wait until your account meets the follower and like thresholds.</li>
                <li>Review TikTok Community Guidelines and remove any flagged content.</li>
                <li>Publish original videos consistently for at least 30 days.</li>
                <li>Make sure your account region is on the supported country list.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={onRecheck}
                className="flex-1 gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
              >
                <RefreshCw className="w-4 h-4" />
                Re-run audit
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800 h-11"
              >
                <Mail className="w-4 h-4" />
                Contact support
              </Button>
            </div>

            <button
              onClick={onBack}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
