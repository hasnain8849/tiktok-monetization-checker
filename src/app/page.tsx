"use client";

import * as React from "react";
import { TopBar, Footer, type ViewKey } from "@/components/tiktok/top-bar";
import { LandingView } from "@/components/tiktok/views/landing-view";
import { CheckerView } from "@/components/tiktok/views/checker-view";
import { ApplyView } from "@/components/tiktok/views/apply-view";
import { RestrictedView } from "@/components/tiktok/views/restricted-view";
import { ProfileDetailView } from "@/components/tiktok/views/profile-detail-view";
import { DashboardView } from "@/components/tiktok/views/dashboard-view";
import { findProfile, type Profile } from "@/lib/tiktok-data";

type Screen =
  | { kind: "landing" }
  | { kind: "checker"; initialHandle: string }
  | { kind: "profile-detail"; profile: Profile }
  | { kind: "apply"; profile: Profile }
  | { kind: "restricted"; profile: Profile }
  | { kind: "dashboard" };

export default function Home() {
  const [screen, setScreen] = React.useState<Screen>({ kind: "landing" });
  const [search, setSearch] = React.useState("");

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
              : "dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar
        active={activeView}
        onNavigate={navigate}
        search={search}
        onSearch={setSearch}
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
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
