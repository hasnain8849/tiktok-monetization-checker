"use client";

import * as React from "react";
import { io as ioClient, type Socket } from "socket.io-client";
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
  const [provider, setProvider] = React.useState<"simulated" | "stripe">("simulated");
  const [stripePublishableKey, setStripePublishableKey] = React.useState<string | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [cardReady, setCardReady] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = React.useState<Stage>("details");
  const [paymentRef, setPaymentRef] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const { toast } = useToast();

  // Subscribe to the payment-notifier websocket for this profile's handle.
  // When a payment-update arrives (via the bank webhook OR admin verify),
  // we transition the stage instantly without waiting for the next poll.
  React.useEffect(() => {
    const handle = profile.handle.replace(/^@/, "").toLowerCase();
    const socket = ioClient("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe", { handle });
      console.log(`[ws] subscribed for ${handle}`);
    });
    socket.on("payment-update", (data: { handle: string; status: string; attemptId?: string }) => {
      console.log(`[ws] payment-update for ${data.handle} status=${data.status}`);
      if (data.status === "verified") {
        setStage("done");
        toast({
          title: "Payment verified",
          description: "Your restriction has been lifted. Re-run the audit.",
        });
      } else if (data.status === "rejected") {
        setStage("details");
        toast({
          title: "Payment rejected",
          description: "An admin rejected your payment. Please contact support.",
          variant: "destructive",
        });
      }
    });
    socket.on("connect_error", (err: Error) => {
      console.warn("[ws] connect error:", err.message);
    });

    return () => {
      socket.emit("unsubscribe", { handle });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [profile.handle, toast]);

  React.useEffect(() => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then((data) => {
        setBank(data.bank);
        setProvider(data.provider ?? "simulated");
        if (data.provider === "stripe" && data.stripePublishableKey) {
          setStripePublishableKey(data.stripePublishableKey);
        }
      })
      .catch((e) => console.warn("payment config fetch failed:", e));
  }, []);

  // Mount Stripe Elements when in stripe mode + we have a clientSecret.
  // The user enters their card into the Stripe iframe; on submit we call
  // stripe.confirmPayment which triggers Stripe's server-side confirmation.
  // Stripe then fires /api/payments/webhook which transitions the attempt
  // to verified → the socket listener picks up the unlock.
  const stripeRef = React.useRef<{ stripe: unknown; elements: unknown } | null>(null);

  React.useEffect(() => {
    if (provider !== "stripe" || !clientSecret || !stripePublishableKey) {
      return;
    }
    let disposed = false;
    (async () => {
      try {
        const stripeMod = await import("@stripe/stripe-js");
        const stripe = await stripeMod.loadStripe(stripePublishableKey);
        if (!stripe || disposed || !cardRef.current) return;
        const elements = stripe.elements({ clientSecret });
        const card = elements.create("payment");
        card.mount(cardRef.current);
        stripeRef.current = { stripe, elements };
        setCardReady(true);
      } catch (e) {
        console.error("Stripe Elements mount failed:", e);
        toast({
          title: "Stripe failed to load",
          description: "Check your STRIPE_PUBLISHABLE_KEY and network.",
          variant: "destructive",
        });
      }
    })();
    return () => {
      disposed = true;
      stripeRef.current = null;
      setCardReady(false);
    };
  }, [provider, clientSecret, stripePublishableKey, toast]);

  // Confirm the Stripe PaymentIntent. Triggered by the "Pay with card"
  // button that appears below the Stripe Elements form.
  const confirmStripePayment = async () => {
    const ref = stripeRef.current;
    if (!ref) {
      toast({
        title: "Stripe not ready",
        description: "The payment form is still loading.",
        variant: "destructive",
      });
      return;
    }
    setStage("verifying");
    try {
      // @ts-expect-error — TypeScript doesn't see the @stripe/stripe-js types
      // because we lazy-import. The runtime API matches these calls.
      const result = await ref.stripe.confirmPayment({
        elements: ref.elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: "if_required",
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Stripe confirmation failed");
      }
      // Stripe confirmed server-side; the webhook will fire next, which
      // transitions the attempt to verified → the socket listener picks up
      // the unlock. We just keep the "verifying" stage until that happens.
      toast({
        title: "Card charged",
        description:
          "Stripe confirmed your payment. Waiting for verification webhook…",
      });
    } catch (e) {
      console.error(e);
      setStage("details");
      toast({
        title: "Payment failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

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
    try {
      // 1. Submit the payment → creates a *pending* PaymentAttempt.
      //    In simulated mode the setTimeout webhook fires after 30s.
      //    In stripe mode a real Stripe PaymentIntent is created with
      //    the returned clientSecret (which the frontend could confirm
      //    via Stripe Elements — for now we just track it as intentId).
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: profile.handle,
          paymentRef: paymentRef.trim(),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as {
        attemptId: string;
        status: string;
        provider?: string;
        clientSecret?: string | null;
        intentId?: string | null;
      };
      if (data.provider === "stripe" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        // Stripe Elements mounting happens in a separate useEffect
        // that watches clientSecret + stripePublishableKey. The user
        // would enter their card details into the Stripe iframe and
        // Stripe would confirm the payment server-side, then Stripe's
        // webhook fires /api/payments/webhook which transitions the
        // attempt to verified. We just wait for the socket event.
        setStage("verifying");
      } else {
        setStage("verifying");
      }

      // 2. Poll the attempt status until the webhook verifies it (or timeout).
      // 60 polls × 1s = 60s window — gives the admin (or the 30s simulated
      // webhook) time to mark the attempt as verified.
      const maxPolls = 60;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((res) => setTimeout(res, 800));
        const s = await fetch(`/api/payments/${data.attemptId}`, {
          cache: "no-store",
        });
        if (!s.ok) continue;
        const st = (await s.json()) as { status: string };
        if (st.status === "verified") {
          setStage("done");
          toast({
            title: "Payment verified",
            description: "Your restriction has been lifted. Re-run the audit.",
          });
          return;
        }
        if (st.status === "rejected") {
          throw new Error("rejected");
        }
      }
      throw new Error("verification timeout");
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

              {/* Bank payment card (simulated provider only) */}
              {provider === "simulated" && bank && (
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

              {!bank && provider === "simulated" && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading bank details...
                </div>
              )}

              {/* Stripe Elements payment card (stripe provider) */}
              {provider === "stripe" && (
                <div className="rounded-xl border border-violet-500/40 bg-violet-500/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {bank?.feeLabel ?? "Account Restriction Unlock Fee"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Secure card payment via Stripe
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-violet-300 tabular-nums">
                        ${(bank?.feeAmount ?? 49).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">{bank?.currency ?? "USD"}</p>
                    </div>
                  </div>

                  {clientSecret ? (
                    <>
                      <div
                        ref={cardRef}
                        className="rounded-lg bg-white p-3 min-h-[180px]"
                        aria-label="Stripe payment form"
                      />
                      {!cardReady && (
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading secure payment form...
                        </p>
                      )}
                      {cardReady && (
                        <Button
                          onClick={confirmStripePayment}
                          className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
                        >
                          <Lock className="w-4 h-4" />
                          Pay ${(bank?.feeAmount ?? 49).toFixed(2)} with card
                        </Button>
                      )}
                      <p className="text-xs text-slate-500">
                        Your card details are sent directly to Stripe. We never
                        see or store them. Stripe&apos;s webhook will verify the
                        payment and unlock your profile instantly.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-violet-300" />
                        Payment reference
                      </label>
                      <Input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="any label e.g. CARD-001"
                        className="glass-input-box text-slate-100 placeholder-slate-500 text-sm rounded-lg border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
                      />
                      <Button
                        onClick={submitPayment}
                        disabled={!paymentRef.trim()}
                        className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11 disabled:opacity-50"
                      >
                        <Lock className="w-4 h-4" />
                        Create payment intent
                      </Button>
                    </div>
                  )}
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
                {stage === "paying" ? "Submitting payment" : "Awaiting bank webhook"}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {stage === "paying"
                  ? "Recording your payment reference and notifying our banking partner..."
                  : "Waiting for the bank webhook to confirm your transfer. This usually takes a few seconds."}
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
