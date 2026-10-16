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
  Users as UsersIcon,
  History,
  Download,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface EmailLogRow {
  id: string;
  to: string;
  subject: string;
  body: string;
  tag: string | null;
  provider: string;
  status: string;
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "verified" | "rejected";
type Tab = "payments" | "audit" | "users";

export function AdminView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = React.useState<Tab>("payments");
  // Track which handle to open the history modal for.
  const [historyHandle, setHistoryHandle] = React.useState<string | null>(null);
  // Track which user to open the history modal for.
  const [historyUserId, setHistoryUserId] = React.useState<string | null>(null);

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
        <button
          onClick={() => setTab("users")}
          className={
            "px-4 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 " +
            (tab === "users"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-400 hover:text-white")
          }
        >
          <UsersIcon className="w-3.5 h-3.5" />
          Users
        </button>
      </div>

      {tab === "payments" && <PaymentsPanel onViewHandle={setHistoryHandle} />}
      {tab === "audit" && <AuditPanel />}
      {tab === "users" && <UsersPanel onViewUser={setHistoryUserId} />}

      <HandleHistoryDialog
        handle={historyHandle}
        onClose={() => setHistoryHandle(null)}
      />
      <UserHistoryDialog
        userId={historyUserId}
        onClose={() => setHistoryUserId(null)}
      />

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

function PaymentsPanel({ onViewHandle }: { onViewHandle: (h: string) => void }) {
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
                    <td className="px-5 py-3 font-medium text-white">
                      <button
                        onClick={() => onViewHandle(a.handle)}
                        className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                        title="View handle history"
                      >
                        {a.handle}
                        <History className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
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
  const [emails, setEmails] = React.useState<EmailLogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showEmails, setShowEmails] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [auditR, emailR] = await Promise.all([
        fetch("/api/admin/audit-log", { cache: "no-store" }),
        fetch("/api/admin/emails", { cache: "no-store" }),
      ]);
      if (auditR.ok) {
        const data = (await auditR.json()) as { entries: AuditEntry[] };
        setEntries(data.entries ?? []);
      }
      if (emailR.ok) {
        const edata = (await emailR.json()) as { emails: EmailLogRow[] };
        setEmails(edata.emails ?? []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load audit log", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const exportUrl = (format: "csv" | "json") =>
    `/api/admin/audit-log/export?format=${format}`;

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-400">
          Every admin action (verify, reject, etc.) is recorded here with the
          actor&apos;s email, the action taken, and the target.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmails((v) => !v)}
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            Emails ({emails.length})
          </Button>
          <a
            href={exportUrl("csv")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            download
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <a
            href={exportUrl("json")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            download
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </a>
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
      </div>

      {showEmails && (
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Outbound emails ({emails.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/40 text-slate-400">
                <tr className="text-left">
                  <th className="px-5 py-2 font-medium">To</th>
                  <th className="px-5 py-2 font-medium">Subject</th>
                  <th className="px-5 py-2 font-medium">Tag</th>
                  <th className="px-5 py-2 font-medium">Provider</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No emails sent yet.
                    </td>
                  </tr>
                ) : (
                  emails.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-2 text-slate-200 text-xs">{m.to}</td>
                      <td className="px-5 py-2 text-slate-300">{m.subject}</td>
                      <td className="px-5 py-2 text-xs">
                        <Badge variant="outline" className="bg-slate-700/40 text-slate-300 border-0">
                          {m.tag ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-5 py-2 text-xs text-slate-500">{m.provider}</td>
                      <td className="px-5 py-2 text-xs">
                        <Badge
                          variant="outline"
                          className={
                            m.status === "sent"
                              ? "bg-emerald-500/20 text-emerald-300 border-0"
                              : "bg-red-500/20 text-red-300 border-0"
                          }
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-2 text-xs text-slate-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(m.createdAt).toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  hasPassword: boolean;
  auditCount: number;
  paymentCount: number;
  unlockCount: number;
}

function UsersPanel({ onViewUser }: { onViewUser: (id: string) => void }) {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { users: AdminUser[] };
      setUsers(data.users ?? []);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setRole = async (id: string, role: "admin" | "user") => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "update failed");
      toast({
        title: role === "admin" ? "User promoted" : "User demoted",
        description: data.changed ? `Role is now ${role}` : "No change",
      });
      if (data.changed) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Update failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-400">
          {users.length} registered user{users.length === 1 ? "" : "s"}. Promote to admin or demote back to user.
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
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Audits</th>
                <th className="px-5 py-3 font-medium">Payments</th>
                <th className="px-5 py-3 font-medium">Unlocks</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] flex items-center justify-center text-white text-[10px] font-bold">
                          {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => onViewUser(u.id)}
                            className="font-medium text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                            title="View user history"
                          >
                            {u.name ?? "—"}
                            <History className="w-3 h-3 opacity-60" />
                          </button>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          {!u.hasPassword && (
                            <span className="text-[10px] text-amber-400 inline-block mt-0.5">
                              no password
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-300">{u.auditCount}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-300">{u.paymentCount}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-300">{u.unlockCount}</td>
                    <td className="px-5 py-3 text-slate-500 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(u.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.role === "admin" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRole(u.id, "user")}
                          className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-8"
                        >
                          Demote
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setRole(u.id, "admin")}
                          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 border-0 h-8"
                        >
                          Promote
                        </Button>
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

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-0">
        <ShieldCheck className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-700/40 text-slate-300 border-0">
      User
    </Badge>
  );
}

interface HandleHistoryData {
  handle: string;
  attempts: PaymentAttempt[];
  auditEntries: AuditEntry[];
  emailEntries: EmailLogRow[];
  unlocked: boolean;
  unlockedAt: string | null;
  paymentRef: string | null;
}

function HandleHistoryDialog({
  handle,
  onClose,
}: {
  handle: string | null;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<HandleHistoryData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!handle) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/handles/${encodeURIComponent(handle)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as HandleHistoryData;
      })
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [handle]);

  return (
    <Dialog open={!!handle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-slate-700 bg-[#0d1626] text-slate-100 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Handle history: {handle}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            All payment attempts and audit-log entries for this handle.
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="py-10 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Unlock status card */}
            <div
              className={
                "rounded-xl border p-4 " +
                (data.unlocked
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-900/40")
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Unlock status</p>
                  {data.unlocked ? (
                    <p className="mt-1 text-base font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Unlocked
                    </p>
                  ) : (
                    <p className="mt-1 text-base font-bold text-slate-300">Not unlocked</p>
                  )}
                </div>
                {data.unlocked && data.unlockedAt && (
                  <p className="text-xs text-slate-400">
                    Paid {new Date(data.unlockedAt).toLocaleString("en-US")}
                    {data.paymentRef && (
                      <span className="ml-2 font-mono text-cyan-300">{data.paymentRef}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Attempts */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Payment attempts ({data.attempts.length})
              </p>
              {data.attempts.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No attempts.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.attempts.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-md border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-slate-300 truncate">
                          {a.paymentRef}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(a.createdAt).toLocaleString("en-US")}
                          <span className="ml-1">· ${a.amount.toFixed(2)} {a.currency}</span>
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Audit entries */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Audit log ({data.auditEntries.length})
              </p>
              {data.auditEntries.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No audit entries.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.auditEntries.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <ActionBadge action={e.action} />
                        <span className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString("en-US")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">by {e.actorEmail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Emails */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Emails ({data.emailEntries?.length ?? 0})
              </p>
              {!data.emailEntries || data.emailEntries.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No emails sent for this handle.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.emailEntries.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {m.subject}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {new Date(m.createdAt).toLocaleString("en-US")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">to {m.to}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {m.tag && (
                          <Badge
                            variant="outline"
                            className="bg-slate-700/40 text-slate-300 border-0 text-[10px]"
                          >
                            {m.tag}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            m.status === "sent"
                              ? "bg-emerald-500/20 text-emerald-300 border-0 text-[10px]"
                              : "bg-red-500/20 text-red-300 border-0 text-[10px]"
                          }
                        >
                          {m.status}
                        </Badge>
                        {m.provider && (
                          <span className="text-[10px] text-slate-500">
                            via {m.provider}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-red-400">Failed to load.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface UserHistoryData {
  user: { id: string; email: string; name: string | null; role: string };
  byThisUser: AuditEntry[];
  againstThisUser: AuditEntry[];
}

export function UserHistoryDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<UserHistoryData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/users/${userId}/history`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as UserHistoryData;
      })
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-slate-700 bg-[#0d1626] text-slate-100 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-cyan-400" />
            User history: {data?.user.email ?? "…"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Actions by this user and actions targeting this user (promote / demote / settings_update).
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="py-10 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">User</p>
                <p className="text-sm font-medium text-white">{data.user.name ?? "—"}</p>
                <p className="text-xs text-slate-400">{data.user.email}</p>
              </div>
              <RoleBadge role={data.user.role} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Actions by this user ({data.byThisUser.length})
              </p>
              {data.byThisUser.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No actions.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.byThisUser.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <ActionBadge action={e.action} />
                        <span className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString("en-US")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        on {e.targetType}
                        {e.targetHandle && (
                          <span className="ml-1 text-cyan-300">{e.targetHandle}</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Actions against this user ({data.againstThisUser.length})
              </p>
              {data.againstThisUser.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No actions.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.againstThisUser.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <ActionBadge action={e.action} />
                        <span className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString("en-US")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">by {e.actorEmail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-red-400">Failed to load.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
