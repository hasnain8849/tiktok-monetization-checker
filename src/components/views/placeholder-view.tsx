"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="border-border shadow-none">
        <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <span className="text-4xl">🚧</span>
          <CardTitle className="text-base">Coming soon</CardTitle>
          <p className="text-sm text-muted-foreground max-w-md">
            This section is part of the BudgetWise roadmap. The current demo
            focuses on the dashboard, transactions list, transaction detail, and
            add-transaction flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
