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
  ScrollText,
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

interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetHandle: string | null;
  metadata: string;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "verified" | "rejected";
type Tab = "payments" | "audit";

export function AdminView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = React.useState<Tab>("payments");

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
        <button
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          ← Back to home
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 p-1 w-fit">
        <button
          onClick={() => setTab("payments")}
          className={
            "px-4 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 " +
            (tab === "payments"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-400 hover:text-white")
          }
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Payments
        </button>
        <button
          onClick={() => setTab("audit")}
          className={
            "px-4 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 " +
            (tab === "audit"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-400 hover:text-white")
          }
        >
          <ScrollText className="w-3.5 h-3.5" />
          Audit Log
        </button>
      </div>

      {tab === "payments" && <PaymentsPanel />}
      {tab === "audit" && <AuditPanel />}

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-slate-300">How admin access works</p>
          <p className="mt-1">
            Sign up with any email ending in{" "}
            <code className="text-cyan-400">@admin.local</code> (e.g.,{" "}
            <code className="text-cyan-400">owner@admin.local</code>) with a
            password of at least 8 chars + a digit. The role is assigned
            automatically on signup. Existing users can be promoted in the
            database by setting <code className="text-cyan-400">role = &quot;admin&quot;</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentsPanel() {
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
  }, [filter, toast]);

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
            ? { ...a, status: action === "verify" ? "verified" : "rejected" }
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

  const counts = React.useMemo(
    () => ({
      total: attempts.length,
      pending: attempts.filter((a) => a.status === "pending").length,
      verified: attempts.filter((a) => a.status === "verified").length,
      rejected: attempts.filter((a) => a.status === "rejected").length,
    }),
    [attempts]
  );

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 p-1">
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
              {f !== "all" && counts[f] > 0 && (
                <span className="ml-1.5 opacity-70">({counts[f]})</span>
              )}
            </button>
          ))}
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
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500 flex items-center justify-center gap-2"
                  >
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
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">
                      {a.paymentRef}
                    </td>
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
    </>
  );
}

function AuditPanel() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/audit-log", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { entries: AuditEntry[] };
      setEntries(data.entries ?? []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load audit log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-400">
          Every admin action (verify, reject, etc.) is recorded here with the
          actor&apos;s email, the action taken, and the target.
        </p>
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

      <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-400">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-500 flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No admin actions yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3 text-slate-200 font-medium">
                      {e.actorEmail}
                    </td>
                    <td className="px-5 py-3">
                      <ActionBadge action={e.action} />
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs">
                          <span className="text-slate-500">{e.targetType}</span>
                          {e.targetId && (
                            <span className="font-mono ml-1.5">
                              {e.targetId.slice(-8)}
                            </span>
                          )}
                        </span>
                        {e.targetHandle && (
                          <span className="text-xs text-cyan-300">
                            {e.targetHandle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs">
                      <MetadataCell metadata={e.metadata} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(e.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
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

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    verify_payment: "bg-emerald-500/20 text-emerald-300",
    reject_payment: "bg-red-500/20 text-red-300",
    promote_user: "bg-cyan-500/20 text-cyan-300",
    demote_user: "bg-amber-500/20 text-amber-300",
    delete_audit: "bg-slate-500/20 text-slate-300",
    settings_update: "bg-blue-500/20 text-blue-300",
  };
  const cls = colors[action] ?? "bg-slate-700/30 text-slate-300";
  return (
    <Badge variant="outline" className={`border-0 ${cls}`}>
      {action.replace(/_/g, " ")}
    </Badge>
  );
}

function MetadataCell({ metadata }: { metadata: string }) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return <span>{metadata}</span>;
  }
  const keys = Object.keys(parsed).slice(0, 4);
  return (
    <span className="font-mono text-[10px] leading-relaxed">
      {keys.map((k) => (
        <span key={k} className="block">
          <span className="text-slate-400">{k}:</span>{" "}
          <span className="text-slate-300">
            {String(parsed![k]).slice(0, 40)}
          </span>
        </span>
      ))}
    </span>
  );
}
