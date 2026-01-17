"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, DollarSign, ArrowRight, Settings } from "lucide-react";
import { StandardPageHeader } from "@/components/ui/standard-page-header";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto space-y-6">
      <StandardPageHeader
        title="Configurações do"
        subtitle="Administrador"
        description="Configure os custos de funcionalidades e os créditos dos planos."
        icon={Settings}
        badge="CONFIGURAÇÕES"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Custos por Funcionalidade</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Configure os custos de crédito para cada funcionalidade do sistema
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/settings/features" className="flex items-center justify-center gap-2">
              Configurar Custos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Planos de Assinatura</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Gerencie os planos do Clerk e seus créditos mensais
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/settings/plans" className="flex items-center justify-center gap-2">
              Gerenciar Planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
