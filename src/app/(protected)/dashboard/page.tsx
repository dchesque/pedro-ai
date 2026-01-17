"use client";

import { useUser } from "@clerk/nextjs";
import { CreditStatus } from "@/components/credits/credit-status";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto space-y-6">
      <StandardPageHeader
        title="Painel"
        subtitle="Principal"
        description={`Bem-vindo de volta, ${user?.firstName || "Usuário"}. Aqui está o resumo da sua atividade.`}
        icon={LayoutDashboard}
        badge="VISÃO GERAL"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CreditStatus />
      </div>
    </div>
  );
}