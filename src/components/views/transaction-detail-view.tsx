"use client";

import * as React from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Tag,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  transactions,
  formatCurrency,
  type Transaction,
} from "@/lib/mock-data";

const timeline = [
  {
    label: "Created",
    description: "Transaction record created",
    icon: Plus,
    color: "bg-muted",
  },
  {
    label: "Categorized",
    description: "Auto-categorized as Food & Dining",
    icon: Tag,
    color: "bg-teal-500",
  },
  {
    label: "Cleared",
    description: "Settled with merchant",
    icon: CheckCircle2,
    color: "bg-teal-500",
  },
];

function similarFrom(txn: Transaction): Transaction[] {
  return transactions
    .filter((t) => t.merchant === txn.merchant && t.id !== txn.id)
    .slice(0, 3);
}

export function TransactionDetailView({
  transaction,
  onBack,
  onEdit,
}: {
  transaction: Transaction | null;
  onBack: () => void;
  onEdit?: () => void;
}) {
  if (!transaction) return null;
  const similar = similarFrom(transaction);
  const isIncome = transaction.amount > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Transactions
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">
          {transaction.merchant}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary */}
        <Card className="lg:col-span-2 border-border shadow-none">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-muted text-2xl">
                  {transaction.categoryIcon}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{transaction.merchant}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {transaction.date}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{transaction.category}</Badge>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      transaction.status === "completed"
                        ? "text-teal-600"
                        : transaction.status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="capitalize">{transaction.status}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums",
                  isIncome ? "text-teal-600" : "text-foreground"
                )}
              >
                {isIncome ? "+" : ""}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium mt-0.5">{transaction.account}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium mt-0.5 capitalize">
                  {transaction.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium mt-0.5">{transaction.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium mt-0.5 tabular-nums">
                  {transaction.date}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </p>
              <p className="text-sm mt-1">
                {transaction.notes || "No notes added."}
              </p>
            </div>

            {transaction.tags && transaction.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  {transaction.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline & actions */}
        <div className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white",
                          step.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {i < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border my-1 min-h-8" />
                      )}
                    </div>
                    <div className="pt-0.5 pb-2">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-4 space-y-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4" />
                  Edit transaction
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4" />
                Download receipt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar transactions */}
      {similar.length > 0 && (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Similar transactions from {transaction.merchant}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {similar.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-sm">
                      {t.categoryIcon}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date} · {t.category}
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
      )}
    </div>
  );
}
