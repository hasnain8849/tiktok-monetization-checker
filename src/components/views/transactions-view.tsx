"use client";

import * as React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Filter,
  Download,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  transactions,
  formatCurrency,
  categories,
  type Transaction,
  type TxnType,
} from "@/lib/mock-data";

const PAGE_SIZE = 10;

const typeFilters: { key: TxnType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "transfer", label: "Transfer" },
];

function TypeBadge({ type }: { type: TxnType }) {
  if (type === "income")
    return (
      <Badge
        variant="outline"
        className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800"
      >
        Income
      </Badge>
    );
  if (type === "transfer")
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
      >
        Transfer
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border-border"
    >
      Expense
    </Badge>
  );
}

export function TransactionsView({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (t: Transaction) => void;
}) {
  const [typeFilter, setTypeFilter] = React.useState<TxnType | "all">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, categoryFilter]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (
        q &&
        !t.merchant.toLowerCase().includes(q) &&
        !t.category.toLowerCase().includes(q) &&
        !t.account.toLowerCase().includes(q) &&
        !(t.notes || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, typeFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-none">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  typeFilter === f.key
                    ? "bg-teal-500 text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(typeFilter !== "all" || categoryFilter !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                setCategoryFilter("all");
              }}
            >
              Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Merchant</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Account</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => onSelect(t)}
                    >
                      <td className="px-6 py-3 whitespace-nowrap tabular-nums">
                        {t.date}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-muted text-xs">
                              {t.categoryIcon}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">
                              {t.merchant}
                            </p>
                            {t.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {t.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <TypeBadge type={t.type} />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {t.account}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs",
                            t.status === "completed"
                              ? "text-teal-600"
                              : t.status === "pending"
                                ? "text-amber-600"
                                : "text-red-600"
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span className="capitalize">{t.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={cn(
                            "font-semibold tabular-nums inline-flex items-center justify-end gap-0.5",
                            t.amount > 0
                              ? "text-teal-600"
                              : "text-foreground"
                          )}
                        >
                          {t.amount > 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : t.type === "transfer" ? (
                            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {t.amount > 0 ? "+" : ""}
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        →
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
