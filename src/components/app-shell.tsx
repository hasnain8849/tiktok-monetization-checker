"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Search,
  Plus,
  ChevronDown,
  Bell,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export type ViewKey =
  | "dashboard"
  | "transactions"
  | "accounts"
  | "budgets"
  | "reports"
  | "settings";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "accounts", label: "Accounts", icon: Wallet },
  { key: "budgets", label: "Budgets", icon: PiggyBank },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

interface AppShellProps {
  active: ViewKey;
  onNavigate: (key: ViewKey) => void;
  search: string;
  onSearch: (v: string) => void;
  onNewTransaction?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  active,
  onNavigate,
  search,
  onSearch,
  onNewTransaction,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/40 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
          <div className="h-8 w-8 rounded-md bg-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold tracking-tight">BudgetWise</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Savings goal</p>
            <p>Emergency fund: $14,520 of $20,000</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: "72%" }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border bg-background/95 backdrop-blur">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-sm">BudgetWise</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">October 2026</span>
            <ChevronDown className="h-4 w-4" />
          </div>

          <div className="flex-1 max-w-md ml-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search transactions, merchants..."
                className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onNewTransaction && (
              <Button
                size="sm"
                onClick={onNewTransaction}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200 text-xs">
                AK
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="mt-auto border-t border-border bg-card/30 px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>BudgetWise — Personal Finance Dashboard</span>
          <span>Built with Next.js, Tailwind, and shadcn/ui · Demo data</span>
        </footer>
      </div>
    </div>
  );
}
