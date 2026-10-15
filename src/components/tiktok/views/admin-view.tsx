"use client";

import * as React from "react";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PaymentAttempt {
  id: string;
  handle: string;
  userId: string | null;
  amount: number;
  currency: string;
  paymentRef: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "verified" | "rejected";

export function AdminView({ onBack }: { onBack: () => void }) {
  const [attempts, setAttempts] = React.useState<PaymentAttempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<StatusFilter>("all");
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? "/api/admin/payments"
          : `/api/admin/payments?status=${filter}`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.status === 403) {
        toast({
          title: "Admin access required",
          description: "Sign in with an @admin.local email to access this page.",
          variant: "destructive",
        });
        onBack();
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { attempts: PaymentAttempt[] };
      setAttempts(data.attempts ?? []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load payments",
        description: "Try again or check the dev log.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, toast, onBack]);

  React.useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, action: "verify" | "reject") => {
    try {
      const r = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast({
        title: action === "verify" ? "Payment verified" : "Payment rejected",
        description: `Attempt ${id.slice(-6)} marked as ${action}`,
      });
      setAttempts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: action === "verify" ? "verified" : "rejected",
              }
            : a
        )
      );
    } catch (e) {
      console.error(e);
      toast({
        title: "Update failed",
        description: "Could not update payment status.",
        variant: "destructive",
      });
    }
  };

  const counts = React.useMemo(() => {
    return {
      total: attempts.length,
      pending: attempts.filter((a) => a.status === "pending").length,
      verified: attempts.filter((a) => a.status === "verified").length,
      rejected: attempts.filter((a) => a.status === "rejected").length,
    };
  }, [attempts]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            Admin · Payment verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manually review pending bank transfer attempts. Verified attempts
            unlock the corresponding profile; rejected attempts stay flagged.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 p-1 w-fit">
        {(["all", "pending", "verified", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "px-4 py-1.5 text-xs font-medium rounded transition-colors capitalize " +
              (filter === f
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:text-white")
            }
          >
            {f}
            {f !== "all" && counts[f as keyof typeof counts] > 0 && (
              <span className="ml-1.5 opacity-70">({counts[f as keyof typeof counts]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-400">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Handle</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No {filter === "all" ? "" : filter + " "}payment attempts.
                  </td>
                </tr>
              ) : (
                attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{a.handle}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">{a.paymentRef}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-300">
                      ${a.amount.toFixed(2)} {a.currency}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                      {a.userId ? a.userId.slice(-6) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(a.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {a.status === "pending" ? (
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            onClick={() => patch(a.id, "verify")}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-8"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => patch(a.id, "reject")}
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-slate-300">How admin access works</p>
          <p className="mt-1">
            Sign up with any email ending in <code className="text-cyan-400">@admin.local</code>{" "}
            (e.g., <code className="text-cyan-400">owner@admin.local</code>) with a password of
            at least 8 chars + a digit. The role is assigned automatically on signup.
            Existing users can be promoted in the database by setting{" "}
            <code className="text-cyan-400">role = &quot;admin&quot;</code>.
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        ← Back to home
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentAttempt["status"] }) {
  if (status === "verified")
    return (
      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-0">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-300 border-0">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-0">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>
  );
}
