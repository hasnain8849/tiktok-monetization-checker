"use client";

import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, Loader2, User as UserIcon, Shield, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AuthButtonProps {
  onAdminNavigate?: () => void;
  onSettingsNavigate?: () => void;
}

export function AuthButton({ onAdminNavigate, onSettingsNavigate }: AuthButtonProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled className="text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        ...
      </Button>
    );
  }

  if (session?.user) {
    const name = session.user.name ?? session.user.email ?? "User";
    const initials = name.slice(0, 2).toUpperCase();
    const role = (session.user as { role?: string }).role ?? "user";
    const isAdmin = role === "admin";
    return (
      <div className="flex items-center gap-2">
        {onSettingsNavigate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsNavigate}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        )}
        {isAdmin && onAdminNavigate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdminNavigate}
            className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10"
            title="Admin console"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>
          <span className="font-medium">{name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-slate-300 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-slate-300 hover:text-white"
      >
        <LogIn className="h-4 w-4" />
        Login
      </Button>
      <AuthDialog open={open} onClose={() => setOpen(false)} toast={toast} />
    </>
  );
}

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}

function AuthDialog({ open, onClose, toast }: AuthDialogProps) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // When the server returns "2FA code required — ...", switch the dialog
  // into the "totp" mode where the user enters their 6-digit code.
  const [needsTotp, setNeedsTotp] = React.useState(false);
  const [totp, setTotp] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    if (mode === "signup" && password.trim().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (mode === "signup" && !/\d/.test(password.trim())) {
      setError("Password must contain at least one digit");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password: password.trim(),
      action: mode === "signup" ? "signup" : "login",
      name: mode === "signup" ? name.trim() : "",
      totp: needsTotp ? totp.trim() : "",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      // If the server says "2FA code required", switch the dialog into
      // the TOTP-entry mode and prompt the user to enter their code.
      if (res.error.toLowerCase().includes("2fa code required")) {
        setNeedsTotp(true);
      }
      toast({
        title: mode === "signup" ? "Signup failed" : "Login failed",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: mode === "signup" ? "Account created" : "Welcome back",
      description:
        mode === "signup"
          ? `Account ${email.trim()} created. You are now logged in.`
          : `Logged in as ${email.trim()}`,
    });
    setName("");
    setEmail("");
    setPassword("");
    setTotp("");
    setNeedsTotp(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-slate-700 bg-[#0d1626] text-slate-100 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-400" />
            {mode === "login" ? "Sign in" : "Create account"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "login"
              ? "Use your email and password to access your saved audits and unlocks."
              : "New accounts auto-create on first signup. Passwords must be ≥ 8 chars with at least one digit. Emails ending in @admin.local get admin privileges (demo)."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-md mb-4">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={
                "py-2 text-sm font-medium rounded transition-colors " +
                (mode === m
                  ? "bg-background shadow-sm text-white"
                  : "text-slate-400 hover:text-white")
              }
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="auth-name" className="text-slate-200">
                Name
              </Label>
              <Input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Kim"
                autoComplete="name"
                className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-pwd" className="text-slate-200">
              Password
            </Label>
            <Input
              id="auth-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 chars + a digit" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
            />
          </div>

          {needsTotp && (
            <div className="space-y-2 rounded-md border border-cyan-500/40 bg-cyan-500/5 p-3">
              <Label htmlFor="auth-totp" className="text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                2FA code (6 digits or backup code)
              </Label>
              <Input
                id="auth-totp"
                type="text"
                inputMode="text"
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                placeholder="123456 or ABCD1234"
                autoFocus
                className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe] font-mono tracking-wider"
              />
              <p className="text-xs text-slate-500">
                Open your authenticator app and enter the 6-digit code, or use
                one of your saved backup codes.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "signup" ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              mode === "signup" ? "Create account" : "Sign in"
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
