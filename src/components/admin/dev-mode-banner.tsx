"use client";

import { AlertTriangle, X } from "lucide-react";
import { useAdminDevMode } from "@/contexts/admin-dev-mode";
import { Button } from "@/components/ui/button";

export function DevModeBanner() {
  const { devMode, setDevMode } = useAdminDevMode();

  if (!devMode) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-900 backdrop-blur supports-[backdrop-filter]:bg-yellow-500/20 dark:text-yellow-100">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>Você está visualizando o painel admin no modo de desenvolvimento.</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-yellow-900 hover:bg-yellow-500/20 dark:text-yellow-100"
        onClick={() => setDevMode(false)}
        aria-label="Desativar modo de desenvolvimento"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
