"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditStatus } from "@/components/credits/credit-status";
import { PlanGrid } from "@/components/billing/plan-grid";
import { CancelSubscriptionDialog } from "@/components/billing/cancel-subscription-dialog";
import { usePublicPlans } from "@/hooks/use-public-plans";
import { Skeleton } from "@/components/ui/skeleton";
import { useCredits } from "@/hooks/use-credits";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { CreditCard, Calendar, Coins, Crown } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const { credits, isLoading } = useCredits();
  const { data: plansData, isLoading: isLoadingPlans } = usePublicPlans();



  // Filter out plans with invalid prices (Asaas minimum is R$ 5.00 = 500 cents)
  // Valid: null, 0 (free), or >= 500 (paid)
  // Invalid: 1-499 (below minimum)
  const validPlans = useMemo(() => {
    if (!plansData?.plans) return [];

    const ASAAS_MIN_CENTS = 500;
    const isPriceValid = (cents: number | null | undefined) => {
      if (cents === null || cents === undefined || cents === 0) return true; // Free is OK
      return cents >= ASAAS_MIN_CENTS; // Must be >= R$ 5.00
    };

    return plansData.plans.filter(plan => {
      const monthlyValid = isPriceValid(plan.priceMonthlyCents);
      const yearlyValid = isPriceValid(plan.priceYearlyCents);
      // Show plan only if both prices (if set) are valid
      return monthlyValid && yearlyValid;
    });
  }, [plansData]);

  const currentPlan = useMemo(() => {
    if (!credits?.plan || credits.plan === "none" || credits.plan === "free") {
      return null;
    }
    return validPlans.find(p => p.id === credits.plan) || {
      id: credits.plan,
      name: credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1),
      credits: credits.creditsTotal
    };
  }, [credits, validPlans]);

  if (!isLoaded || !user || isLoading || isLoadingPlans) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <StandardPageHeader
        title="Cobrança &"
        subtitle="Assinatura"
        description="Gerencie seus créditos, plano e histórico de uso."
        icon={CreditCard}
        badge="FINANCEIRO"
      />
      {currentPlan && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Minha Assinatura
                  {credits?.cancellationScheduled ? (
                    <Badge variant="destructive" className="ml-2">Cancelamento Agendado</Badge>
                  ) : (
                    <Badge variant="default" className="ml-2">Ativo</Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  Detalhes do seu plano atual
                </CardDescription>
              </div>
              <CancelSubscriptionDialog
                planName={currentPlan.name}
                effectiveUntil={credits?.billingPeriodEnd}
                isCancellationScheduled={credits?.cancellationScheduled}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="text-2xl font-bold">{currentPlan.name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  Créditos
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {credits?.creditsRemaining} <span className="text-sm font-normal text-muted-foreground">/ {credits?.creditsTotal}</span>
                  </p>
                  <Progress value={credits?.percentage || 0} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Próxima Renovação
                </p>
                <p className="text-2xl font-bold">
                  {credits?.billingPeriodEnd
                    ? new Date(credits.billingPeriodEnd).toLocaleDateString('pt-BR')
                    : '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentPlan && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Sem Assinatura Ativa
            </CardTitle>
            <CardDescription>
              Escolha um plano abaixo para começar a usar todos os recursos
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="usage">Status dos Créditos</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {currentPlan ? "Alterar Plano" : "Escolha Seu Plano"}
              </CardTitle>
              <CardDescription>
                {currentPlan
                  ? "Faça upgrade ou downgrade do seu plano atual"
                  : "Selecione o plano que melhor se adequa às suas necessidades"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanGrid plans={validPlans} currentPlanId={credits?.plan} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Créditos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreditStatus showUpgradeButton={credits?.isLow} />

              {credits?.isLow && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Atenção:</strong> Seus créditos estão acabando.
                    Considere fazer upgrade do seu plano.
                  </p>
                </div>
              )}

              {credits?.isEmpty && (
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Sem créditos:</strong> Você não pode realizar novas operações.
                    Faça upgrade do seu plano para continuar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
