"use client";

import { AdminTopbar } from "@/components/admin/admin-topbar";
import { DevModeBanner } from "@/components/admin/dev-mode-banner";
import { useAdminDevMode } from "@/contexts/admin-dev-mode";
import { cn } from "@/lib/utils";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const { devMode } = useAdminDevMode();

  return (
    <div className="relative">
      <DevModeBanner />
      <div
        className={cn(
          "flex min-h-svh flex-col",
          devMode ? "pt-12" : ""
        )}
      >
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto pt-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
