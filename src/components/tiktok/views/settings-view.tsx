"use client";

import * as React from "react";
import { ArrowLeft, Save, Loader2, User as UserIcon, KeyRound, Shield, Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface AccountInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export function SettingsView({ onBack }: { onBack: () => void }) {
  const [info, setInfo] = React.useState<AccountInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [currentPwd, setCurrentPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [savingName, setSavingName] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Notification settings state
  const [paymentEmailsEnabled, setPaymentEmailsEnabled] = React.useState(true);
  const [eligibilityAlertsEnabled, setEligibilityAlertsEnabled] = React.useState(true);
  const [mutedHandlesRaw, setMutedHandlesRaw] = React.useState("");
  const [savingNotifs, setSavingNotifs] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { user: AccountInfo };
        setInfo(data.user);
        setName(data.user.name ?? "");
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: "Failed to load account",
          description: "Please sign in first.",
          variant: "destructive",
        });
        onBack();
      })
      .finally(() => setLoading(false));
  }, [toast, onBack]);

  // Fetch notification settings in parallel.
  React.useEffect(() => {
    fetch("/api/account/notifications", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as {
          settings: {
            paymentEmailsEnabled: boolean;
            eligibilityAlertsEnabled: boolean;
            mutedHandles: string[];
          };
        };
        setPaymentEmailsEnabled(data.settings.paymentEmailsEnabled);
        setEligibilityAlertsEnabled(data.settings.eligibilityAlertsEnabled);
        setMutedHandlesRaw(data.settings.mutedHandles.join(", "));
      })
      .catch((e) => console.warn("notif settings fetch failed:", e));
  }, []);

  const saveNotifications = async () => {
    setSavingNotifs(true);
    try {
      const mutedHandles = mutedHandlesRaw
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
      const r = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentEmailsEnabled,
          eligibilityAlertsEnabled,
          mutedHandles,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "update failed");
      toast({
        title: "Notification settings saved",
        description: "Your preferences are now active.",
      });
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setSavingNotifs(false);
    }
  };

  const saveName = async () => {
    setError(null);
    setSavingName(true);
    try {
      const r = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "update failed");
      toast({ title: "Name updated", description: "Your profile name has been saved." });
      setInfo((prev) => (prev ? { ...prev, name: name.trim() } : prev));
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  const savePwd = async () => {
    setError(null);
    if (!currentPwd || !newPwd) {
      setError("Current and new passwords are required");
      return;
    }
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(newPwd)) {
      setError("New password must contain at least one digit");
      return;
    }
    setSavingPwd(true);
    try {
      const r = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "update failed");
      toast({
        title: "Password changed",
        description: "Your new password is now active.",
      });
      setCurrentPwd("");
      setNewPwd("");
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading || !info) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading account...
      </div>
    );
  }

  const initials = (info.name ?? info.email).slice(0, 2).toUpperCase();
  const isAdmin = info.role === "admin";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400">
          Update your profile name and password.
        </p>
      </div>

      {/* Profile card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] text-white text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-bold text-white">{info.name ?? "—"}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {info.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {isAdmin ? (
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-700/40 text-slate-300 border-0">
                  User
                </Badge>
              )}
              <span className="text-xs text-slate-500">
                Joined {new Date(info.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Name form */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          Profile name
        </h2>
        <div className="space-y-2">
          <Label htmlFor="settings-name" className="text-slate-200">
            Display name
          </Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Kim"
            maxLength={80}
            className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
          />
        </div>
        <Button
          onClick={saveName}
          disabled={savingName || name.trim() === (info.name ?? "")}
          className="gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
        >
          {savingName ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save name
            </>
          )}
        </Button>
      </div>

      {/* Password form */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          Change password
        </h2>
        <div className="space-y-2">
          <Label htmlFor="settings-curr-pwd" className="text-slate-200">
            Current password
          </Label>
          <Input
            id="settings-curr-pwd"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Your current password"
            autoComplete="current-password"
            className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-new-pwd" className="text-slate-200">
            New password
          </Label>
          <Input
            id="settings-new-pwd"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="At least 8 chars + a digit"
            autoComplete="new-password"
            className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
          />
          <p className="text-xs text-slate-500">
            Must be at least 8 characters and contain at least one digit.
          </p>
        </div>
        <Button
          onClick={savePwd}
          disabled={savingPwd || !currentPwd || !newPwd}
          className="gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11 disabled:opacity-50"
        >
          {savingPwd ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Change password
            </>
          )}
        </Button>
      </div>

      {/* Notifications form */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Notification preferences
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-slate-800 bg-slate-900/40 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-200">Payment verification emails</p>
              <p className="text-xs text-slate-500">
                Sent when a payment you submitted is verified by an admin or webhook.
              </p>
            </div>
            <Switch
              checked={paymentEmailsEnabled}
              onCheckedChange={setPaymentEmailsEnabled}
            />
          </label>
          <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-slate-800 bg-slate-900/40 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-200">Eligibility alert emails</p>
              <p className="text-xs text-slate-500">
                Sent by the scheduled re-audit job when your saved profile&apos;s
                eligibility status changes.
              </p>
            </div>
            <Switch
              checked={eligibilityAlertsEnabled}
              onCheckedChange={setEligibilityAlertsEnabled}
            />
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="muted-handles" className="text-slate-200">
            Muted handles (comma-separated)
          </Label>
          <Input
            id="muted-handles"
            type="text"
            value={mutedHandlesRaw}
            onChange={(e) => setMutedHandlesRaw(e.target.value)}
            placeholder="@prankzlife, @spamhandle"
            className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
          />
          <p className="text-xs text-slate-500">
            We won&apos;t send eligibility-alert emails for these handles. Useful
            if you saved a profile just to track it but don&apos;t want noise.
          </p>
        </div>
        <Button
          onClick={saveNotifications}
          disabled={savingNotifs}
          className="gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
        >
          {savingNotifs ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save notification settings"
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
