"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanGrid } from "@/components/billing/plan-grid";
import { usePublicPlans } from "@/hooks/use-public-plans";
import { SimpleTopbar } from "@/components/app/simple-topbar";
import { CreditCard, Sparkles, Shield, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscribePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-background to-muted/20">
      <SimpleTopbar />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Selecione o plano ideal para suas necessidades. Todos os planos incluem acesso completo à plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Acesso Imediato</p>
              <p className="text-xs text-muted-foreground">Comece a usar agora</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Pagamento Seguro</p>
              <p className="text-xs text-muted-foreground">PIX, Boleto ou Cartão</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Cancele a Qualquer Momento</p>
              <p className="text-xs text-muted-foreground">Sem fidelidade</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Planos Disponíveis
            </CardTitle>
            <CardDescription>
              Compare os planos e escolha o melhor para você. Você pode alterar seu plano a qualquer momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscribePlans />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao assinar, você concorda com nossos termos de serviço e política de privacidade.
        </p>
      </main>
    </div>
  );
}

function SubscribePlans() {
  const { data, isLoading } = usePublicPlans()
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }
  
  return <PlanGrid plans={data?.plans || []} />
}
