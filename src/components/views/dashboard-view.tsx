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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  kpis,
  balanceTrend,
  spendingByCategory,
  transactions,
  formatCurrency,
  formatCompact,
  type Transaction,
} from "@/lib/mock-data";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  positiveIsGood: boolean;
  hint?: string;
}

function KpiCard({ label, value, delta, positiveIsGood, hint }: KpiCardProps) {
  const isUp = delta > 0;
  const isGood = isUp === positiveIsGood;
  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
              isGood
                ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const categoryColors = ["#0d9488", "#f59e0b", "#3b82f6", "#ec4899", "#6b7280"];

function RecentTransactions({ items }: { items: Transaction[] }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <CardDescription>Latest activity across your accounts</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-teal-600">
          View all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.slice(0, 6).map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-sm">
                  {t.categoryIcon}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.merchant}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t.category} · {t.date}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  t.amount > 0 ? "text-teal-600" : "text-foreground"
                )}
              >
                {t.amount > 0 ? "+" : ""}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your money at a glance · October 2026
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" />
          Updated just now
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total balance"
          value={formatCurrency(kpis.totalBalance)}
          delta={kpis.totalBalanceDelta}
          positiveIsGood={true}
          hint="Across 3 accounts"
        />
        <KpiCard
          label="Income"
          value={formatCurrency(kpis.income)}
          delta={kpis.incomeDelta}
          positiveIsGood={true}
          hint="vs. September"
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(kpis.expenses)}
          delta={kpis.expensesDelta}
          positiveIsGood={false}
          hint="vs. September"
        />
        <KpiCard
          label="Savings rate"
          value={`${kpis.savingsRate}%`}
          delta={kpis.savingsRateDelta}
          positiveIsGood={true}
          hint="Of income saved"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Balance trend</CardTitle>
            <CardDescription>Last 6 months · USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceTrend}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompact(Number(v))}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#balGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
            <CardDescription>October 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {spendingByCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={categoryColors[i % categoryColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, n: string) => [`${v}%`, n]}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {spendingByCategory.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          categoryColors[i % categoryColors.length],
                      }}
                    />
                    <span className="text-muted-foreground">{c.name}</span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(c.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions items={transactions} />
        </div>
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Accounts</CardTitle>
            <CardDescription>3 connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: "Chase Checking",
                mask: "•••• 4521",
                balance: 8420.55,
                positive: true,
              },
              {
                name: "Chase Savings",
                mask: "•••• 8830",
                balance: 14520.77,
                positive: true,
              },
              {
                name: "Amex Credit",
                mask: "•••• 1009",
                balance: -1639.0,
                positive: false,
              },
            ].map((a) => (
              <div
                key={a.mask}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.mask}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    a.positive ? "text-foreground" : "text-red-600"
                  )}
                >
                  {formatCurrency(a.balance)}
                </span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              + Add account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
