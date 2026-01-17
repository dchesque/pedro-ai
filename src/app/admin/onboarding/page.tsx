import { DeveloperOnboarding } from "@/components/admin/onboarding/developer-onboarding";
import { getEnvChecklist, isEnvConfigured } from "@/lib/onboarding/env-check";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { CheckCircle2 } from "lucide-react";

/**
 * Server Component - A checagem de variáveis de ambiente é feita no servidor
 * para garantir acesso às variáveis server-side (CLERK_SECRET_KEY, DATABASE_URL, etc.)
 * e evitar expor valores sensíveis ao cliente.
 */
export default function AdminOnboardingPage() {
  // Executado no servidor - tem acesso a todas as variáveis de ambiente
  const envChecklist = getEnvChecklist();
  const openRouterConfigured = isEnvConfigured('OPENROUTER_API_KEY');

  return (
    <div className="container mx-auto space-y-8">
      <StandardPageHeader
        title="Configurações"
        subtitle="Iniciais"
        description="Use este roteiro sempre que precisar preparar uma nova máquina de desenvolvimento ou validar o estado da configuração do projeto."
        icon={CheckCircle2}
        badge="ONBOARDING"
      />

      <DeveloperOnboarding envChecklist={envChecklist} openRouterConfigured={openRouterConfigured} />
    </div>
  );
}
