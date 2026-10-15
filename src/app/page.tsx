"use client";

import * as React from "react";
import { AppShell, type ViewKey } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { TransactionsView } from "@/components/views/transactions-view";
import { TransactionDetailView } from "@/components/views/transaction-detail-view";
import { AddTransactionView } from "@/components/views/add-transaction-view";
import { AuthView } from "@/components/views/auth-view";
import { PlaceholderView } from "@/components/views/placeholder-view";
import type { Transaction } from "@/lib/mock-data";

type Screen =
  | { kind: "auth" }
  | { kind: "main"; view: ViewKey }
  | { kind: "detail"; txn: Transaction }
  | { kind: "add" };

export default function Home() {
  const [screen, setScreen] = React.useState<Screen>({ kind: "auth" });
  const [search, setSearch] = React.useState("");
  const [authed, setAuthed] = React.useState(false);

  // Auto-skip auth for first-time preview so users can see the app immediately.
  React.useEffect(() => {
    // Show auth for 1 second, then drop into the main app (demo mode).
    const t = setTimeout(() => {
      setAuthed(true);
      setScreen({ kind: "main", view: "dashboard" });
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const activeView: ViewKey =
    screen.kind === "main"
      ? screen.view
      : screen.kind === "detail"
        ? "transactions"
        : screen.kind === "add"
          ? "transactions"
          : "dashboard";

  const navigate = (v: ViewKey) => {
    setSearch("");
    setScreen({ kind: "main", view: v });
  };

  // Render auth screen without shell
  if (screen.kind === "auth" || !authed) {
    return (
      <AuthView
        onAuthed={() => {
          setAuthed(true);
          setScreen({ kind: "main", view: "dashboard" });
        }}
      />
    );
  }

  return (
    <AppShell
      active={activeView}
      onNavigate={navigate}
      search={search}
      onSearch={setSearch}
      onNewTransaction={() => setScreen({ kind: "add" })}
    >
      {screen.kind === "main" && screen.view === "dashboard" && <DashboardView />}
      {screen.kind === "main" && screen.view === "transactions" && (
        <TransactionsView
          search={search}
          onSelect={(t) => setScreen({ kind: "detail", txn: t })}
        />
      )}
      {screen.kind === "main" &&
        (screen.view === "accounts" ||
          screen.view === "budgets" ||
          screen.view === "reports" ||
          screen.view === "settings") && (
          <PlaceholderView
            title={navTitle(screen.view)}
            description={navDescription(screen.view)}
          />
        )}
      {screen.kind === "detail" && (
        <TransactionDetailView
          transaction={screen.txn}
          onBack={() => setScreen({ kind: "main", view: "transactions" })}
          onEdit={() => setScreen({ kind: "add" })}
        />
      )}
      {screen.kind === "add" && (
        <AddTransactionView
          onClose={() => setScreen({ kind: "main", view: "transactions" })}
          onSave={() => setScreen({ kind: "main", view: "transactions" })}
        />
      )}
    </AppShell>
  );
}

function navTitle(v: ViewKey): string {
  const map: Record<ViewKey, string> = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    accounts: "Accounts",
    budgets: "Budgets",
    reports: "Reports",
    settings: "Settings",
  };
  return map[v];
}

function navDescription(v: ViewKey): string {
  const map: Record<ViewKey, string> = {
    dashboard: "",
    transactions: "",
    accounts: "All connected accounts and balances",
    budgets: "Monthly spending goals by category",
    reports: "Insights, trends, and exportable summaries",
    settings: "Preferences, notifications, and connected banks",
  };
  return map[v];
}
