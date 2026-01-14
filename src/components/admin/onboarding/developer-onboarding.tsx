"use client";

import { type ReactNode, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdminPlans, useClerkPlans } from "@/hooks/use-admin-plans";
import { useAdminUsers, useSyncFromClerk } from "@/hooks/admin/use-admin-users";
import { useToast } from "@/hooks/use-toast";
import type { ClerkEnvKey, EnvChecklistItem } from "@/lib/onboarding/env-check";
import { CLERK_ENV_KEYS } from "@/lib/onboarding/env-check";
import { cn } from "@/lib/utils";
import { useAdminDevMode } from "@/contexts/admin-dev-mode";
import { site } from "@/lib/brand-config";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ChevronDown,
  RefreshCcw,
  Settings2,
  Users,
  Palette,
  Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const datetimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type StepState = "complete" | "pending" | "info";
const CLERK_KEY_SET = new Set<string>(CLERK_ENV_KEYS);

export function DeveloperOnboarding({ envChecklist, openRouterConfigured }: { envChecklist: EnvChecklistItem[]; openRouterConfigured: boolean }) {
  const { devMode } = useAdminDevMode();
  const { data: plansData } = useAdminPlans();
  const planCount = plansData?.plans?.length ?? 0;
  const hasPlans = planCount > 0;

  const usersQuery = useAdminUsers({ pageSize: 1 });
  const hasUsers = (usersQuery.data?.users?.length ?? 0) > 0;
  const loadingUsers = usersQuery.isLoading;

  const { refetch: fetchClerkPlans, isFetching: syncingPlans } = useClerkPlans();
  const syncFromClerkMutation = useSyncFromClerk();
  const { toast } = useToast();

  const [lastPlanSync, setLastPlanSync] = useState<{ date: Date; count: number } | null>(null);
  const [lastUserSyncAt, setLastUserSyncAt] = useState<Date | null>(null);

  const envStats = useMemo(() => {
    const configuredCount = envChecklist.filter((item) => item.isConfigured).length;
    return {
      configuredCount,
      total: envChecklist.length,
      complete: configuredCount === envChecklist.length,
    };
  }, [envChecklist]);

  const clerkEnvStatus = useMemo(() => {
    const relevant = envChecklist.filter((item): item is EnvChecklistItem & { key: ClerkEnvKey } =>
      isClerkEnvKey(item.key)
    );
    const missing = relevant.filter((item) => !item.isConfigured);
    return {
      ready: missing.length === 0,
      missing,
    };
  }, [envChecklist]);

  const clerkEnvReady = clerkEnvStatus.ready;
  const missingClerkEnvKeys = clerkEnvStatus.missing;
  const missingClerkEnvLabel =
    missingClerkEnvKeys.length > 0 ? missingClerkEnvKeys.map((item) => item.key).join(", ") : "";
  const planStepState: StepState = !clerkEnvReady
    ? "pending"
    : lastPlanSync
      ? "complete"
      : hasPlans
        ? "info"
        : "pending";
  const planStepHelper = !clerkEnvReady
    ? `Configure as chaves do Clerk (${missingClerkEnvLabel}) para continuar`
    : lastPlanSync
      ? `Última sincronização manual em ${datetimeFormatter.format(lastPlanSync.date)}`
      : hasPlans
        ? "Planos criados no Clerk. Sincronize para importar."
        : "Crie e sincronize um plano de teste no Clerk";
  const handleSyncPlans = async () => {
    try {
      const result = await fetchClerkPlans();
      const count = result.data?.plans?.length ?? 0;
      setLastPlanSync({ date: new Date(), count });

      toast({
        title: "Planos sincronizados",
        description:
          count > 0
            ? `Encontramos ${count} plano(s) no Clerk. Ajuste os créditos em /admin/settings/plans.`
            : "Nenhum plano foi retornado pelo Clerk. Confirme se você criou ofertas no dashboard.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao sincronizar planos";
      toast({ title: "Falha ao sincronizar", description: message, variant: "destructive" });
    }
  };

  const handleSyncUsers = () => {
    syncFromClerkMutation.mutate(
      { syncUsers: true, syncPlans: true, setCredits: true },
      {
        onSuccess: () => {
          setLastUserSyncAt(new Date());
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <StepCard
          number={1}
          title="Checar variáveis de ambiente obrigatórias"
          description="Certifique-se de que o arquivo .env (ou .env.local) contenha os segredos mínimos para rodar Clerk, webhooks e o app."
          state={envStats.complete ? "complete" : "pending"}
          helper={`${envStats.configuredCount}/${envStats.total} variáveis configuradas`}
        >
          <EnvChecklist items={envChecklist} />
          <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-100">
            Compare com <code>.env.example</code> e ajuste conforme necessário. Recarregue o servidor após alterações.
          </div>
        </StepCard>

        {devMode && (
          <StepCard
            number={2}
            title="Configurações de marca (Brand Configs)"
            description="Visualize as configurações atuais da marca e saiba onde alterá-las no código."
            state="info"
            helper="Modo dev ativo - apenas para desenvolvedores"
          >
            <BrandConfigDisplay />
          </StepCard>
        )}

        <StepCard
          number={devMode ? 3 : 2}
          title="Configurar planos de assinatura no Clerk"
          description="Ative o billing beta, crie um plano de teste e mantenha o dashboard em modo de desenvolvimento antes de qualquer sincronização."
          state={planStepState}
          helper={planStepHelper}
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Acesse o dashboard do Clerk &gt; Billing &gt; Subscriptions.</li>
            <li>Ative o recurso de subscriptions no modo <strong>Development</strong>.</li>
            <li>Crie pelo menos um plano recorrente para testes (recomendo mensal).</li>
          </ul>
          {!clerkEnvReady && missingClerkEnvKeys.length > 0 && (
            <ClerkEnvBlock missingKeys={missingClerkEnvKeys} />
          )}
          <div className="rounded-lg border border-yellow-300/40 bg-yellow-500/10 p-3 text-sm text-yellow-900 dark:text-yellow-200">
            Faça primeiro no ambiente de desenvolvimento do Clerk para evitar tocar usuários reais.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" asChild>
              <Link href="https://dashboard.clerk.com/apps" target="_blank" rel="noreferrer">
                Ver apps Clerk
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3 border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">
              O botão abaixo chama <code>/api/admin/clerk/plans</code> e importa os planos diretamente. Depois disso,
              ajuste os créditos por plano em <code>/admin/settings/plans</code>.
            </p>
            {lastPlanSync && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-100">
                Importação registrou {lastPlanSync.count} plano(s).
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSyncPlans} disabled={!clerkEnvReady || syncingPlans}>
                {syncingPlans ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sincronizar agora
                  </>
                )}
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/admin/settings/plans">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Ajustar créditos e planos
                </Link>
              </Button>
            </div>
          </div>
        </StepCard>

        <StepCard
          number={devMode ? 4 : 3}
          title="Sincronizar usuários do Clerk"
          description="Se você ainda não configurou o webhook local do Clerk, faça uma sincronização manual para popular usuários e vínculos de assinatura no banco."
          state={!clerkEnvReady ? "pending" : lastUserSyncAt ? "complete" : hasUsers ? "info" : "pending"}
          helper={
            !clerkEnvReady
              ? `Configure as chaves do Clerk (${missingClerkEnvLabel}) para liberar esta etapa`
              : lastUserSyncAt
                ? `Rodado em ${datetimeFormatter.format(lastUserSyncAt)}`
                : loadingUsers
                  ? "Conferindo usuários..."
                  : hasUsers
                    ? "Usuários já existem localmente"
                    : "Nenhum usuário encontrado localmente"
          }
        >
          <p className="text-sm text-muted-foreground">
            Esta ação chama <code>/api/admin/users/sync</code>, busca usuários e assinaturas no Clerk e opcionalmente cria
            saldos locais de créditos. Execute sempre que precisar alinhar o estado.
          </p>
          {!clerkEnvReady && missingClerkEnvKeys.length > 0 && (
            <ClerkEnvBlock missingKeys={missingClerkEnvKeys} />
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSyncUsers} disabled={!clerkEnvReady || syncFromClerkMutation.isPending}>
              {syncFromClerkMutation.isPending ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Sincronizar com Clerk
                </>
              )}
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/admin/users">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Revisar usuários
              </Link>
            </Button>
          </div>
        </StepCard>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  helper,
  state,
  children,
}: {
  number: number;
  title: string;
  description: string;
  helper?: string;
  state: StepState;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(state === "complete");
  const previousStateRef = useRef<StepState>(state);

  useEffect(() => {
    if (previousStateRef.current !== state) {
      previousStateRef.current = state;
      setCollapsed(state === "complete");
    }
  }, [state]);

  const canToggle = state === "complete";

  return (
    <Card
      data-collapsed={collapsed}
      data-state={state}
      className={cn(
        "transition-colors",
        collapsed ? "border-dashed border-border/60 bg-card/40 backdrop-blur" : ""
      )}
    >
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            Etapa {number}
          </span>
          <CardTitle className="text-xl text-foreground">{title}</CardTitle>
          <StatusBadge state={state} helper={undefined} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {helper && <span className="max-w-xs text-right sm:text-left">{helper}</span>}
          {canToggle && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 font-medium transition hover:text-foreground"
              aria-expanded={!collapsed}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", collapsed ? "" : "rotate-180")}
              />
              {collapsed ? "Expandir detalhes" : "Compactar etapa"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardDescription
        className={cn(
          "px-6",
          collapsed ? "line-clamp-1 text-xs" : "pb-4 text-sm"
        )}
      >
        {description}
      </CardDescription>
      <Separator className="opacity-40" />
      <CardContent
        className={cn(
          "space-y-4 pt-6 text-sm text-foreground transition-all",
          collapsed ? "hidden" : "block"
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ state, helper }: { state: StepState; helper?: string }) {
  const config: Record<StepState, { label: string; variant: "secondary" | "destructive" | "outline"; icon: LucideIcon }> = {
    complete: { label: "Concluído", variant: "secondary", icon: CheckCircle2 },
    pending: { label: "Pendente", variant: "destructive", icon: CircleAlert },
    info: { label: "Em andamento", variant: "outline", icon: ClipboardCheck },
  };

  const Icon = config[state].icon;

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge variant={config[state].variant} className="text-sm">
        <Icon className="h-4 w-4" />
        {config[state].label}
      </Badge>
      {helper && <span className="text-xs text-muted-foreground max-w-[220px] text-right leading-snug">{helper}</span>}
    </div>
  );
}

function EnvChecklist({ items }: { items: EnvChecklistItem[] }) {
  const adminItems = items.filter(item => item.key === 'ADMIN_EMAILS' || item.key === 'ADMIN_USER_IDS');
  const hasAdminConfig = adminItems.some(item => item.isConfigured);
  const adminEmailsItem = items.find(item => item.key === 'ADMIN_EMAILS');
  const adminUserIdsItem = items.find(item => item.key === 'ADMIN_USER_IDS');

  const adminEmails = adminEmailsItem?.value?.split(',').map(e => e.trim()).filter(Boolean) || [];
  const adminUserIds = adminUserIdsItem?.value?.split(',').map(id => id.trim()).filter(Boolean) || [];

  const storageItems = items.filter(item => item.key === 'BLOB_READ_WRITE_TOKEN' || item.key === 'REPLIT_STORAGE_BUCKET_ID');
  const hasStorageConfig = storageItems.some(item => item.isConfigured);

  // Ordenar: não configurados primeiro, depois configurados
  const sortedItems = [...items].sort((a, b) => {
    if (a.isConfigured === b.isConfigured) return 0;
    return a.isConfigured ? 1 : -1;
  });

  return (
    <div className="space-y-3">
      {sortedItems.map((item) => {
        const isAdminItem = item.key === 'ADMIN_EMAILS' || item.key === 'ADMIN_USER_IDS';
        const isStorageItem = item.key === 'BLOB_READ_WRITE_TOKEN' || item.key === 'REPLIT_STORAGE_BUCKET_ID';
        const showAdminWarning = isAdminItem && !hasAdminConfig;
        const showStorageWarning = isStorageItem && !hasStorageConfig;
        const isNotConfigured = !item.isConfigured;

        return (
          <div
            key={item.key}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-4",
              item.isConfigured
                ? "border-border/60 bg-background/40"
                : "border-dashed border-amber-500/50 bg-amber-500/5"
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {item.category}
              </Badge>
              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{item.key}</code>
            </div>
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {showAdminWarning && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Pelo menos uma das variáveis ADMIN (ADMIN_EMAILS ou ADMIN_USER_IDS) deve estar configurada para acessar o painel admin.
                </p>
              )}
              {showStorageWarning && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Pelo menos uma das variáveis de storage (BLOB_READ_WRITE_TOKEN ou REPLIT_STORAGE_BUCKET_ID) deve estar configurada para uploads de arquivos.
                </p>
              )}
              {isNotConfigured && !showAdminWarning && !showStorageWarning && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Esta variável precisa ser configurada no arquivo .env para o funcionamento correto da aplicação.
                </p>
              )}
              {item.docsPath && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Referência: <code>{item.docsPath}</code>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.isConfigured ? "secondary" : "destructive"}>
                {item.isConfigured ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Configurada
                  </>
                ) : (
                  <>
                    <CircleAlert className="h-3.5 w-3.5" /> Pendente
                  </>
                )}
              </Badge>
              {!item.isConfigured && !isAdminItem && !isStorageItem && (
                <span className="text-xs text-muted-foreground">Adicione este valor no .env</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Mostrar lista de admins configurados */}
      {hasAdminConfig && (adminEmails.length > 0 || adminUserIds.length > 0) && (
        <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 p-4">
          <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Admins Configurados
          </h4>
          {adminEmails.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                Emails ({adminEmails.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {adminEmails.map((email, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {adminUserIds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                User IDs ({adminUserIds.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {adminUserIds.map((userId, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-mono">
                    {userId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClerkEnvBlock({ missingKeys }: { missingKeys: EnvChecklistItem[] }) {
  const list = missingKeys.map((item) => item.key).join(", ");
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
      <p className="font-semibold">Configure as variáveis do Clerk para liberar esta ação.</p>
      <p className="text-destructive/80">Faltando: {list}</p>
    </div>
  );
}

function isClerkEnvKey(key: string): key is ClerkEnvKey {
  return CLERK_KEY_SET.has(key);
}

function BrandConfigDisplay() {
  const { toast } = useToast();

  const generateAIPrompt = () => {
    return `Altere as configurações de marca no arquivo src/lib/brand-config.ts com as seguintes informações:

INFORMAÇÕES BÁSICAS:
- Nome completo: ${site.name}
- Nome curto: ${site.shortName}
- Descrição: ${site.description}
- Autor: ${site.author}
- URL base: ${site.url}

PALAVRAS-CHAVE:
${site.keywords.map(k => `- ${k}`).join('\n')}

LOGOS E ÍCONES:
- Logo claro: ${site.logo.light || 'Não configurado'}
- Logo escuro: ${site.logo.dark || 'Não configurado'}
- Favicon: ${site.icons.favicon || 'Não configurado'}
- Apple Touch Icon: ${site.icons.apple || 'Não configurado'}
- Shortcut Icon: ${site.icons.shortcut || 'Não configurado'}
- Open Graph Image: ${site.ogImage || 'Não configurado'}

REDES SOCIAIS:
- Twitter/X: ${site.socials.twitter || 'Não configurado'}

SUPORTE:
- Email: ${site.support.email || 'Não configurado'}

ANALYTICS (variáveis de ambiente - configure no .env):
- Google Tag Manager: ${site.analytics.gtmId || 'NEXT_PUBLIC_GTM_ID'}
- Google Analytics 4: ${site.analytics.gaMeasurementId || 'NEXT_PUBLIC_GA_ID'}
- Facebook Pixel: ${site.analytics.facebookPixelId || 'NEXT_PUBLIC_FACEBOOK_PIXEL_ID'}

INSTRUÇÕES:
1. Abra o arquivo src/lib/brand-config.ts
2. Atualize o objeto 'site' com os novos valores acima
3. Mantenha a estrutura e tipos existentes
4. Para analytics, as variáveis são lidas de process.env, então apenas atualize os valores padrão se necessário
5. Consulte .context/docs/brand-config.md para mais detalhes`;
  };

  const handleCopyPrompt = async () => {
    try {
      const prompt = generateAIPrompt();
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Prompt copiado!",
        description: "Cole o prompt na sua IA para alterar as brand configs automaticamente.",
      });
    } catch (error) {
      console.error("Failed to copy AI prompt", error)
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-100">
        <p className="font-semibold mb-1">📝 Onde alterar:</p>
        <p>Edite o arquivo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">src/lib/brand-config.ts</code> para modificar essas configurações.</p>
        <p className="mt-2">Documentação completa: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.context/docs/brand-config.md</code></p>
      </div>

      <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">🤖 Prompt para IA</h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              Copie este prompt e cole na sua IA para alterar as brand configs automaticamente.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className="shrink-0"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar prompt
          </Button>
        </div>
        <div className="rounded-md bg-background/80 border border-emerald-200/40 dark:border-emerald-800/40 p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {generateAIPrompt()}
          </pre>
        </div>
      </div>

      <div className="space-y-3">
        <ConfigSection title="Informações básicas">
          <ConfigItem label="Nome completo" value={site.name} />
          <ConfigItem label="Nome curto" value={site.shortName} />
          <ConfigItem label="Descrição" value={site.description} />
          <ConfigItem label="Autor" value={site.author} />
          <ConfigItem label="URL base" value={site.url} />
        </ConfigSection>

        <ConfigSection title="Palavras-chave">
          <div className="flex flex-wrap gap-2">
            {site.keywords.map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </ConfigSection>

        <ConfigSection title="Redes sociais">
          <ConfigItem label="Twitter/X" value={site.socials.twitter || "Não configurado"} />
        </ConfigSection>

        <ConfigSection title="Suporte">
          <ConfigItem label="Email" value={site.support.email || "Não configurado"} />
        </ConfigSection>

        <ConfigSection title="Analytics (variáveis de ambiente)">
          <ConfigItem
            label="Google Tag Manager"
            value={site.analytics.gtmId || "Não configurado (NEXT_PUBLIC_GTM_ID)"}
          />
          <ConfigItem
            label="Google Analytics 4"
            value={site.analytics.gaMeasurementId || "Não configurado (NEXT_PUBLIC_GA_ID)"}
          />
          <ConfigItem
            label="Facebook Pixel"
            value={site.analytics.facebookPixelId || "Não configurado (NEXT_PUBLIC_FACEBOOK_PIXEL_ID)"}
          />
          <div className="mt-3 rounded-md border border-amber-300/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold mb-1">⚠️ Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Os analytics só são carregados após o usuário aceitar os cookies (LGPD/GDPR)</li>
              <li>As variáveis são lidas em build time - reinicie o servidor após alterar o .env</li>
              <li>Para testar: aceite os cookies e verifique o console do navegador</li>
              <li>Componente: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">src/components/analytics/pixels.tsx</code></li>
            </ul>
          </div>
        </ConfigSection>
      </div>

      <div className="rounded-lg border border-purple-300/40 bg-purple-500/10 p-3 text-sm text-purple-900 dark:text-purple-200">
        <p className="font-semibold mb-1">💡 Dica:</p>
        <p>As configurações de analytics são lidas de variáveis de ambiente. Adicione-as ao <code>.env</code> se necessário.</p>
      </div>
    </div>
  );
}

function ConfigSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Palette className="h-4 w-4" />
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground font-medium">{label}:</span>
      <code className="rounded bg-muted px-2 py-1 text-xs break-all">{value}</code>
    </div>
  );
}
