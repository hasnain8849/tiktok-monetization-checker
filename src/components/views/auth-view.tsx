"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TrendingUp,
  PieChart,
  Target,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[0-9]/, "Must contain a digit"),
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.638-.057-1.252-.164-1.84H12v3.481h5.384c-.232 1.247-.936 2.302-1.996 3.01v2.51h3.227c1.89-1.742 2.985-4.31 2.985-7.161z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.615-2.422l-3.227-2.51c-.895.6-2.04.952-3.388.952-2.605 0-4.81-1.762-5.595-4.131H3.07v2.59A9.99 9.99 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.889A6.012 6.012 0 0 1 6.09 12c0-.659.114-1.3.314-1.889V7.52H3.07A10.008 10.008 0 0 0 2 12c0 1.615.387 3.144 1.07 4.48l3.335-2.591z"
      />
      <path
        fill="#EA4335"
        d="M12 6.44c1.469 0 2.788.505 3.823 1.496l2.867-2.867C16.96 3.43 14.696 2.5 12 2.5A9.99 9.99 0 0 0 3.07 7.52l3.335 2.591C7.19 8.242 9.395 6.44 12 6.44z"
      />
    </svg>
  );
}

function GoogleButton() {
  return (
    <Button type="button" variant="outline" className="w-full">
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}

export function AuthView({ onAuthed }: { onAuthed?: () => void }) {
  const [tab, setTab] = React.useState<"login" | "signup">("login");
  const [showPwd, setShowPwd] = React.useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLogin = (v: LoginValues) => {
    toast({
      title: "Welcome back",
      description: `Logged in as ${v.email}`,
    });
    onAuthed?.();
  };
  const onSignup = (v: SignupValues) => {
    toast({
      title: "Account created",
      description: `Welcome to BudgetWise, ${v.name.split(" ")[0]}!`,
    });
    onAuthed?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden border-border shadow-none p-0">
        {/* Left brand panel */}
        <div className="hidden md:flex flex-col justify-between bg-teal-500 text-white p-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-white/20 flex items-center justify-center">
              <span className="font-bold">B</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">BudgetWise</span>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold leading-tight">
              Take control of <br /> your money.
            </h2>
            <ul className="space-y-4 text-sm text-white/90">
              <li className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">Track spending</span> across
                  accounts, cards, and cash
                </span>
              </li>
              <li className="flex items-start gap-3">
                <PieChart className="h-5 w-5 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">Visual reports</span> that show
                  where every dollar goes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="h-5 w-5 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">Budget goals</span> with smart
                  alerts when you're trending over
                </span>
              </li>
            </ul>
          </div>
          <p className="text-xs text-white/70">
            Trusted by 50,000+ savers · Bank-grade encryption
          </p>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-10 bg-background">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-md bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold">BudgetWise</span>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-md mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-2 text-sm font-medium rounded transition-colors",
                  tab === t
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pwd">Password</Label>
                <div className="relative">
                  <Input
                    id="login-pwd"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <a className="text-teal-600 hover:underline" href="#">
                  Forgot password?
                </a>
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                Log in
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              <GoogleButton />
              <p className="text-xs text-center text-muted-foreground">
                New to BudgetWise?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-teal-600 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form
              onSubmit={signupForm.handleSubmit(onSignup)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="su-name">Full name</Label>
                <Input
                  id="su-name"
                  placeholder="Alex Kim"
                  autoComplete="name"
                  {...signupForm.register("name")}
                />
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-red-600">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-red-600">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-pwd">Password</Label>
                <div className="relative">
                  <Input
                    id="su-pwd"
                    type={showPwd ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    {...signupForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-red-600">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                By signing up you agree to our{" "}
                <a className="underline" href="#">
                  Terms
                </a>{" "}
                and{" "}
                <a className="underline" href="#">
                  Privacy Policy
                </a>
                .
              </p>
              <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              <GoogleButton />
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-teal-600 hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
