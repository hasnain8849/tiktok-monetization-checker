"use client";

import * as React from "react";
import { TopBar, Footer, type ViewKey } from "@/components/tiktok/top-bar";
import { LandingView } from "@/components/tiktok/views/landing-view";
import { CheckerView } from "@/components/tiktok/views/checker-view";
import { ApplyView } from "@/components/tiktok/views/apply-view";
import { RestrictedView } from "@/components/tiktok/views/restricted-view";
import { ProfileDetailView } from "@/components/tiktok/views/profile-detail-view";
import { DashboardView } from "@/components/tiktok/views/dashboard-view";
import { AdminView } from "@/components/tiktok/views/admin-view";
import { SettingsView } from "@/components/tiktok/views/settings-view";
import { StripeDocsView } from "@/components/tiktok/views/stripe-docs-view";
import { SharedProfileView } from "@/components/tiktok/views/shared-profile-view";
import { type Profile } from "@/lib/tiktok-data";

type Screen =
  | { kind: "landing" }
  | { kind: "checker"; initialHandle: string }
  | { kind: "profile-detail"; profile: Profile }
  | { kind: "apply"; profile: Profile }
  | { kind: "restricted"; profile: Profile }
  | { kind: "dashboard" }
  | { kind: "admin" }
  | { kind: "settings" }
  | { kind: "stripe-docs" }
  | { kind: "shared-profile"; token: string };

// ViewKey adds an "admin" type that is only shown when the session user is an admin.
export type AppViewKey = ViewKey | "admin";

export default function Home() {
  const [screen, setScreen] = React.useState<Screen>({ kind: "landing" });
  const [search, setSearch] = React.useState("");
  // Callbacks for AuthButton to navigate to admin / settings screens.
  const goAdmin = React.useCallback(() => setScreen({ kind: "admin" }), []);
  const goSettings = React.useCallback(() => setScreen({ kind: "settings" }), []);
  const goStripeDocs = React.useCallback(() => setScreen({ kind: "stripe-docs" }), []);

  // Share an audit profile: POSTs to /api/profiles/[handle]/share, gets a
  // token back, opens the SharedProfileView with that token.
  const shareProfile = React.useCallback(async (p: Profile) => {
    try {
      const r = await fetch(`/api/profiles/${encodeURIComponent(p.handle)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok || !data.token) {
        throw new Error(data.error ?? "share failed");
      }
      const shareUrl = `${window.location.origin}/share/${data.token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Clipboard may be unavailable in some sandboxed contexts — non-fatal.
      }
      setScreen({ kind: "shared-profile", token: data.token });
    } catch (e) {
      console.error("share failed:", e);
      // Fall back to a toast or alert — for now, just console.error.
    }
  }, []);

  const navigate = (v: ViewKey) => {
    if (v === "landing") setScreen({ kind: "landing" });
    else if (v === "checker") setScreen({ kind: "checker", initialHandle: "@mrbeast" });
    else if (v === "dashboard") setScreen({ kind: "dashboard" });
    else setScreen({ kind: "landing" });
  };

  const activeView: ViewKey =
    screen.kind === "landing"
      ? "landing"
      : screen.kind === "checker"
        ? "checker"
        : screen.kind === "profile-detail"
          ? "checker"
          : screen.kind === "apply"
            ? "checker"
            : screen.kind === "restricted"
              ? "checker"
              : screen.kind === "admin"
                ? "dashboard"
                : "dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar
        active={activeView}
        onNavigate={navigate}
        search={search}
        onSearch={setSearch}
        onAdminNavigate={goAdmin}
        onSettingsNavigate={goSettings}
        onStripeDocsNavigate={goStripeDocs}
      />
      <main className="flex-1">
        {screen.kind === "landing" && (
          <LandingView
            onCheck={(h) => setScreen({ kind: "checker", initialHandle: h })}
            onSeeResults={(p) => setScreen({ kind: "profile-detail", profile: p })}
            onGoDashboard={() => setScreen({ kind: "dashboard" })}
          />
        )}
        {screen.kind === "checker" && (
          <CheckerView
            initialHandle={screen.initialHandle}
            onBack={() => setScreen({ kind: "landing" })}
            onResult={(p) => setScreen({ kind: "profile-detail", profile: p })}
            onApply={(p) => setScreen({ kind: "apply", profile: p })}
          />
        )}
        {screen.kind === "profile-detail" && (
          <ProfileDetailView
            profile={screen.profile}
            onBack={() => setScreen({ kind: "landing" })}
            onApply={(p) => setScreen({ kind: "apply", profile: p })}
            onUnlock={(p) => setScreen({ kind: "restricted", profile: p })}
            onShare={shareProfile}
          />
        )}
        {screen.kind === "apply" && (
          <ApplyView
            profile={screen.profile}
            onBack={() => setScreen({ kind: "profile-detail", profile: screen.profile })}
            onApproved={() => setScreen({ kind: "dashboard" })}
            onRestricted={() => setScreen({ kind: "restricted", profile: screen.profile })}
          />
        )}
        {screen.kind === "restricted" && (
          <RestrictedView
            profile={screen.profile}
            onBack={() => setScreen({ kind: "landing" })}
            onRecheck={() =>
              setScreen({ kind: "checker", initialHandle: screen.profile.handle })
            }
            onUnlocked={() => setScreen({ kind: "dashboard" })}
          />
        )}
        {screen.kind === "dashboard" && (
          <DashboardView
            search={search}
            onSearch={setSearch}
            onOpenCheck={(handle) =>
              setScreen({ kind: "checker", initialHandle: handle })
            }
          />
        )}
        {screen.kind === "admin" && (
          <AdminView onBack={() => setScreen({ kind: "landing" })} />
        )}
        {screen.kind === "settings" && (
          <SettingsView onBack={() => setScreen({ kind: "landing" })} />
        )}
        {screen.kind === "stripe-docs" && (
          <StripeDocsView onBack={() => setScreen({ kind: "landing" })} />
        )}
        {screen.kind === "shared-profile" && (
          <SharedProfileView
            token={screen.token}
            onBack={() => setScreen({ kind: "landing" })}
          />
        )}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
