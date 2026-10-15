"use client";

import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, Loader2, User as UserIcon, X } from "lucide-react";
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

export function AuthButton() {
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
    return (
      <div className="flex items-center gap-2">
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
      <LoginDialog open={open} onClose={() => setOpen(false)} toast={toast} />
    </>
  );
}

function LoginDialog({
  open,
  onClose,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password: password.trim(),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast({
        title: "Login failed",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Welcome",
      description: `Logged in as ${email.trim()}`,
    });
    setEmail("");
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-slate-700 bg-[#0d1626] text-slate-100 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-cyan-400" />
              Sign in to BudgetWise
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Demo mode — any email + password (≥ 4 chars) works. Your audits
            and unlocks will be saved to your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="login-email"
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
            <Label htmlFor="login-pwd" className="text-slate-200">
              Password
            </Label>
            <Input
              id="login-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              autoComplete="current-password"
              required
              className="glass-input-box text-slate-100 placeholder-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-[#00f2fe]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn-primary text-white font-semibold rounded-xl border-0 h-11"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in / Create account"
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            No signup required — new emails are auto-registered.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
