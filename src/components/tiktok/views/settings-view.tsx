"use client";

import * as React from "react";
import { ArrowLeft, Save, Loader2, User as UserIcon, KeyRound, Shield, Mail, Bell, Share2 } from "lucide-react";
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

interface ShareTokenRow {
  id: string;
  token: string;
  handle: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
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
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [setupData, setSetupData] = React.useState<{
    secret: string;
    qrDataUrl: string;
    manualKey: string;
  } | null>(null);
  const [setupLoading, setSetupLoading] = React.useState(false);
  const [totpCode, setTotpCode] = React.useState("");
  const [verifyingTotp, setVerifyingTotp] = React.useState(false);
  const [backupCodes, setBackupCodes] = React.useState<string[] | null>(null);
  const [disableCode, setDisableCode] = React.useState("");
  const [disabling, setDisabling] = React.useState(false);
  const [regenCode, setRegenCode] = React.useState("");
  const [regenerating, setRegenerating] = React.useState(false);
  // Share tokens state
  const [shareTokens, setShareTokens] = React.useState<ShareTokenRow[]>([]);
  const [shareLoading, setShareLoading] = React.useState(false);
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

  // Fetch 2FA status in parallel.
  React.useEffect(() => {
    fetch("/api/account/2fa/status", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as { enabled: boolean };
        setTwoFactorEnabled(data.enabled);
      })
      .catch((e) => console.warn("2FA status fetch failed:", e));
  }, []);

  const start2FASetup = async () => {
    setSetupLoading(true);
    try {
      const r = await fetch("/api/account/2fa/setup", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as {
        secret: string;
        qrDataUrl: string;
        manualKey: string;
      };
      setSetupData(data);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setSetupLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!totpCode.trim()) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }
    setVerifyingTotp(true);
    setError(null);
    try {
      const r = await fetch("/api/account/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "verify failed");
      setBackupCodes(data.backupCodes as string[]);
      setTwoFactorEnabled(true);
      setSetupData(null);
      setTotpCode("");
      toast({
        title: "2FA enabled",
        description: "Save your backup codes — they will only be shown once.",
      });
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setVerifyingTotp(false);
    }
  };

  const disable2FA = async () => {
    if (!disableCode.trim()) {
      setError("Enter a TOTP code or backup code to confirm disabling 2FA");
      return;
    }
    setDisabling(true);
    setError(null);
    try {
      const r = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "disable failed");
      setTwoFactorEnabled(false);
      setDisableCode("");
      toast({ title: "2FA disabled", description: "Login will use password only." });
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setDisabling(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!regenCode.trim()) {
      setError("Enter a TOTP code or remaining backup code to regenerate backup codes");
      return;
    }
    setRegenerating(true);
    setError(null);
    try {
      const r = await fetch("/api/account/2fa/regenerate-backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: regenCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "regenerate failed");
      setBackupCodes(data.backupCodes as string[]);
      setRegenCode("");
      toast({
        title: "Backup codes regenerated",
        description: "Save these new codes — they will only be shown once.",
      });
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

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

  // Share-token management
  const loadShareTokens = React.useCallback(async () => {
    setShareLoading(true);
    try {
      const r = await fetch("/api/account/share-tokens", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { tokens: ShareTokenRow[] };
      setShareTokens(data.tokens ?? []);
    } catch (e) {
      console.warn("share tokens fetch failed:", e);
    } finally {
      setShareLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadShareTokens();
  }, [loadShareTokens]);

  const revokeShareToken = async (id: string) => {
    try {
      const r = await fetch(`/api/account/share-tokens/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast({ title: "Share token revoked", description: "The public URL no longer works." });
      setShareTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, revokedAt: new Date().toISOString() } : t))
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Revoke failed", variant: "destructive" });
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

      {/* 2FA section */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Two-factor authentication (TOTP)
        </h2>

        {twoFactorEnabled ? (
          <div className="space-y-3">
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✅ 2FA is enabled. You&apos;ll need a 6-digit code from your
              authenticator app (or a backup code) on every login.
            </div>
            {backupCodes && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                <p className="text-xs font-medium text-amber-300">
                  Backup codes (shown only once — save them now):
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-200">
                  {backupCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBackupCodes(null)}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 h-8"
                >
                  I&apos;ve saved them
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="disable-2fa" className="text-slate-200">
                Disable 2FA
              </Label>
              <Input
                id="disable-2fa"
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Enter TOTP code or backup code"
                className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
              />
              <Button
                onClick={disable2FA}
                disabled={disabling || !disableCode.trim()}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-11"
              >
                {disabling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </div>

            {/* Regenerate backup codes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <Label htmlFor="regen-2fa" className="text-slate-200">
                Regenerate backup codes
              </Label>
              <p className="text-xs text-slate-500">
                If your backup codes are lost or used up, generate a fresh
                set. The old codes will be invalidated.
              </p>
              <div className="flex gap-2">
                <Input
                  id="regen-2fa"
                  type="text"
                  value={regenCode}
                  onChange={(e) => setRegenCode(e.target.value)}
                  placeholder="TOTP code or remaining backup code"
                  className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
                />
                <Button
                  onClick={regenerateBackupCodes}
                  disabled={regenerating || !regenCode.trim()}
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 h-11 shrink-0"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Regenerate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : setupData ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Scan this QR code with your authenticator app (Google
              Authenticator, 1Password, Authy, etc.) to add an account.
            </p>
            <div className="rounded-lg bg-white p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setupData.qrDataUrl}
                alt="TOTP QR code"
                width={200}
                height={200}
              />
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-xs">
              <p className="text-slate-500">Manual key (if you can&apos;t scan):</p>
              <p className="font-mono text-cyan-300 mt-1 break-all">{setupData.manualKey}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-code" className="text-slate-200">
                6-digit code from your authenticator app
              </Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe] text-2xl tracking-[0.5em] text-center font-mono"
              />
              <Button
                onClick={verify2FA}
                disabled={verifyingTotp || totpCode.length !== 6}
                className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
              >
                {verifyingTotp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify + enable 2FA"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Add an extra layer of security to your account. Once enabled,
              every login will require a 6-digit code from your authenticator
              app in addition to your password.
            </p>
            <Button
              onClick={start2FASetup}
              disabled={setupLoading}
              className="gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
            >
              {setupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Set up 2FA"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Share tokens section */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-cyan-400" />
          Share tokens ({shareTokens.length})
        </h2>
        <p className="text-xs text-slate-400">
          Public, read-only URLs that anyone can use to view an audit snapshot
          without logging in. You&apos;ll be emailed when someone views your
          share link. Click Revoke to invalidate a link immediately.
        </p>
        {shareLoading && shareTokens.length === 0 ? (
          <div className="text-xs text-slate-500 flex items-center gap-2 py-3">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </div>
        ) : shareTokens.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center">
            No share tokens yet. Click &quot;Share audit&quot; on any profile
            detail page to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {shareTokens.map((t) => {
              const expired =
                t.expiresAt && new Date(t.expiresAt).getTime() < Date.now();
              const revoked = !!t.revokedAt;
              const active = !expired && !revoked;
              return (
                <div
                  key={t.id}
                  className={
                    "rounded-md border p-3 flex items-center justify-between gap-3 " +
                    (revoked
                      ? "border-slate-800 bg-slate-900/20 opacity-60"
                      : expired
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-cyan-500/30 bg-cyan-500/5")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{t.handle}</span>
                      {revoked && (
                        <Badge variant="outline" className="bg-slate-700/40 text-slate-400 border-0 text-[10px]">
                          Revoked
                        </Badge>
                      )}
                      {expired && !revoked && (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                          Expired
                        </Badge>
                      )}
                      {active && (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                      <span className="font-mono truncate max-w-[200px]">
                        {t.token.slice(0, 20)}…
                      </span>
                      <span>Created {new Date(t.createdAt).toLocaleDateString("en-US")}</span>
                      {t.expiresAt && (
                        <span>
                          {expired ? "Expired" : "Expires"}{" "}
                          {new Date(t.expiresAt).toLocaleDateString("en-US")}
                        </span>
                      )}
                    </div>
                  </div>
                  {active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeShareToken(t.id)}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8 shrink-0"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
