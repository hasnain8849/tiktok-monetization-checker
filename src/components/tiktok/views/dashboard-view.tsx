"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Search,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  formatCount,
} from "@/lib/tiktok-data";
import { cn } from "@/lib/utils";

// Audit row returned by the /api/audits endpoint (Prisma SavedAudit).
interface ApiAudit {
  id: string;
  handle: string;
  avatarInitials: string;
  followers: number;
  eligible: boolean;
  status: "eligible" | "ineligible" | "restricted";
  checksPassed: number;
  checksTotal: number;
  checkedAt: string;
}

const sparkData = [
  { day: "Mon", checks: 410, eligible: 290 },
  { day: "Tue", checks: 480, eligible: 330 },
  { day: "Wed", checks: 520, eligible: 380 },
  { day: "Thu", checks: 460, eligible: 320 },
  { day: "Fri", checks: 590, eligible: 410 },
  { day: "Sat", checks: 720, eligible: 510 },
  { day: "Sun", checks: 680, eligible: 480 },
];

const regionData = [
  { name: "US", value: 48, color: "#00f2fe" },
  { name: "UK", value: 18, color: "#fe2c55" },
  { name: "Brazil", value: 14, color: "#10b981" },
  { name: "Germany", value: 10, color: "#4facfe" },
  { name: "Other", value: 10, color: "#6b7280" },
];

interface DashboardViewProps {
  search: string;
  onSearch: (v: string) => void;
  onOpenCheck: (handle: string) => void;
}

function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "magenta" | "green" | "red";
}) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    magenta: "text-[#fe2c55] bg-[#fe2c55]/10",
    green: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[accent])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded", deltaPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>
          {delta}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

export function DashboardView({ search, onSearch, onOpenCheck }: DashboardViewProps) {
  const [audits, setAudits] = React.useState<ApiAudit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAudits = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/audits", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { audits: ApiAudit[] };
      setAudits(data.audits ?? []);
    } catch (e) {
      console.error(e);
      setError("Could not load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const stats = React.useMemo(() => {
    const total = audits.length;
    const eligible = audits.filter((a) => a.status === "eligible").length;
    const ineligible = audits.filter((a) => a.status === "ineligible").length;
    const restricted = audits.filter((a) => a.status === "restricted").length;
    return { total, eligible, ineligible, restricted, saved: total };
  }, [audits]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter((a) => a.handle.toLowerCase().includes(q));
  }, [search, audits]);

  const deleteAudit = async (id: string) => {
    try {
      const r = await fetch(`/api/audits?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Track your monetization audits and saved profiles.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total checks" value={formatCount(stats.total + 12400)} delta="+12%" deltaPositive icon={Search} accent="cyan" />
        <StatCard label="Eligible" value={formatCount(stats.eligible + 8742)} delta="+8%" deltaPositive icon={CheckCircle2} accent="green" />
        <StatCard label="Ineligible" value={formatCount(stats.ineligible + 3140)} delta="-3%" deltaPositive={false} icon={AlertTriangle} accent="magenta" />
        <StatCard label="Restricted" value={formatCount(stats.restricted + 518)} delta="+1%" deltaPositive={false} icon={Ban} accent="red" />
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {loading
            ? "Loading audits..."
            : error
              ? <span className="text-red-400">{error}</span>
              : `${stats.total} saved audit${stats.total === 1 ? "" : "s"} in your database`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAudits}
          disabled={loading}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Checks this week</h2>
              <p className="text-xs text-slate-400 mt-0.5">7-day rolling window</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Checks
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#fe2c55]">
                <span className="w-2 h-2 rounded-full bg-[#fe2c55]" /> Eligible
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00f2fe" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="magentaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fe2c55" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#fe2c55" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2942" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0d1626",
                    border: "1px solid #1a2942",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area type="monotone" dataKey="checks" stroke="#00f2fe" strokeWidth={2} fill="url(#cyanGrad)" />
                <Area type="monotone" dataKey="eligible" stroke="#fe2c55" strokeWidth={2} fill="url(#magentaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl">
          <div className="mb-3">
            <h2 className="text-base font-bold text-white">Top regions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Eligible checks by country</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={regionData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {regionData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${v}%`, n]}
                  contentStyle={{ background: "#0d1626", border: "1px solid #1a2942", borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {regionData.map((r) => (
              <li key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-slate-400">{r.name}</span>
                </span>
                <span className="font-medium tabular-nums text-white">{r.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent checks table */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Recent audits</h2>
            <p className="text-xs text-slate-400 mt-0.5">All profiles you've recently checked</p>
          </div>
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Filter by handle..."
                className="glass-input-box text-slate-100 placeholder-slate-500 text-sm rounded-lg pl-9 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-400">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Handle</th>
                <th className="px-5 py-3 font-medium">Followers</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Passed</th>
                <th className="px-5 py-3 font-medium">Checked</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    {search
                      ? `No audits match "${search}".`
                      : "No audits yet. Run a profile check to populate this list."}
                  </td>
                </tr>
              ) : (
                filtered.map((c: ApiAudit) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    <td
                      className="px-5 py-3 cursor-pointer"
                      onClick={() => onOpenCheck(c.handle)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-[#fe2c55] text-white text-xs">
                            {c.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-white">{c.handle}</span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3 tabular-nums text-slate-300 cursor-pointer"
                      onClick={() => onOpenCheck(c.handle)}
                    >
                      {formatCount(c.followers)}
                    </td>
                    <td
                      className="px-5 py-3 cursor-pointer"
                      onClick={() => onOpenCheck(c.handle)}
                    >
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-400">
                      {c.checksPassed}/{c.checksTotal}
                    </td>
                    <td
                      className="px-5 py-3 text-slate-500 inline-flex items-center gap-1.5 cursor-pointer"
                      onClick={() => onOpenCheck(c.handle)}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(c.checkedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAudit(c.id);
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                        aria-label="Delete audit"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApiAudit["status"] }) {
  if (status === "eligible")
    return (
      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-0">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Eligible
      </Badge>
    );
  if (status === "restricted")
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-300 border-0">
        <Ban className="w-3 h-3 mr-1" />
        Restricted
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-0">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Ineligible
    </Badge>
  );
}
