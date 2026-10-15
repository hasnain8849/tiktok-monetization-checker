"use client";

import * as React from "react";
import { Home, Search, BarChart3, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/tiktok/auth-button";
import { cn } from "@/lib/utils";

export type ViewKey =
  | "landing"
  | "checker"
  | "apply"
  | "restricted"
  | "profile-detail"
  | "dashboard";

interface TopBarProps {
  active: ViewKey;
  onNavigate: (v: ViewKey) => void;
  search?: string;
  onSearch?: (v: string) => void;
  onAdminNavigate?: () => void;
  onSettingsNavigate?: () => void;
}

const navLinks: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "landing", label: "Home", icon: Home },
  { key: "checker", label: "Checker", icon: Search },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
];

export function TikTokMark() {
  return (
    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.46V8.75a8.19 8.19 0 0 0 4.89 1.62V6.92a4.87 4.87 0 0 1-1-.23z" />
    </svg>
  );
}

export function TopBar({ active, onNavigate, search, onSearch, onAdminNavigate, onSettingsNavigate }: TopBarProps) {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#fe2c55] via-slate-900 to-[#00f2fe] p-[1.5px] flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#070D18] rounded-[10px] flex items-center justify-center">
              <TikTokMark />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            TikTok{" "}
            <span className="font-normal text-slate-300 hidden sm:inline">
              Monetization Checker
            </span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((l) => {
            const Icon = l.icon;
            const isActive = active === l.key;
            return (
              <button
                key={l.key}
                onClick={() => onNavigate(l.key)}
                className={cn(
                  "flex items-center gap-1.5 py-1 transition-colors relative",
                  isActive ? "text-[#00f2fe]" : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00f2fe] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {onSearch && (
          <div className="hidden lg:block flex-1 max-w-xs">
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search creators..."
              className="glass-input-box text-slate-100 placeholder-slate-500 text-sm rounded-full border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <AuthButton
            onAdminNavigate={onAdminNavigate}
            onSettingsNavigate={onSettingsNavigate}
          />
          <Button
            size="sm"
            className="gradient-btn-primary text-white font-semibold rounded-full shadow-lg shadow-[#fe2c55]/20 hover:shadow-[#fe2c55]/40 transition duration-200 border-0"
            onClick={() => onNavigate("checker")}
          >
            <Sparkles className="h-4 w-4" />
            Get Started
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8 hidden sm:flex">
            <AvatarFallback className="bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] text-white text-xs">
              AK
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export function Footer({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  return (
    <footer className="border-t border-border bg-[#04080e] py-12 text-slate-500 text-xs sm:text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe]" />
          <span>TikTok Monetization Checker © 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a className="hover:text-slate-300 transition-colors" href="#privacy">Privacy Policy</a>
          <a className="hover:text-slate-300 transition-colors" href="#terms">Terms and Conditions</a>
          <a className="hover:text-slate-300 transition-colors" href="#support">Support</a>
        </div>
      </div>
    </footer>
  );
}
