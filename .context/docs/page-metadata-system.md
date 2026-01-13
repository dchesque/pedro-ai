# Sistema de Metadados de Página

## Visão Geral

O sistema de metadados de página é um mecanismo centralizado baseado em React Context para gerenciar dinamicamente **títulos**, **descrições** e **breadcrumbs** em páginas protegidas da aplicação. Ele promove consistência visual, evita prop drilling e integra-se automaticamente ao layout principal via `AppShell`.

**Arquitetura principal**:
- **Contexto**: `src/contexts/page-metadata.tsx` – Gerencia estado reativo (`PageMetadataState`).
- **Renderização**: `src/components/app/page-header.tsx` – Consome contexto e renderiza UI.
- **Hook principal**: `src/hooks/use-page-config.ts` – API simplificada para configuração.
- **Integração**: Ativado em `src/app/(protected)/layout.tsx` e `src/components/app/app-shell.tsx`.

**Benefícios**:
- Atualizações reativas sem re-renderizações globais (memoização).
- Breadcrumbs automáticos baseados em `usePathname()` (Next.js).
- Suporte a overrides customizados.
- TypeScript rigoroso com `BreadcrumbItem`.

## Tipos Principais

```tsx
// src/contexts/page-metadata.tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageMetadataState {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBreadcrumbs?: boolean;
}
```

## Componentes e Provedores

### `PageMetadataProvider`
- **Uso**: Envolve layouts protegidos.
  ```tsx
  // src/app/(protected)/layout.tsx (exemplo implícito)
  <PageMetadataProvider>
    {children}
    <PageHeader />
  </PageMetadataProvider>
  ```
- **Comportamento**:
  - Merge de atualizações (última chamada prevalece).
  - Gera `breadcrumbs` automáticos se ausentes.
  - Expõe `usePageMetadata` e `useSetPageMetadata`.

### `PageHeader`
- **Renderiza**:
  1. Breadcrumbs (`src/components/ui/breadcrumbs.tsx`).
  2. `<h1>{title}</h1>`.
  3. `<p className="text-muted-foreground">{description}</p>`.
- **Condicionais**:
  | Estado | Renderização |
  |--------|--------------|
  | Sem metadados | Nada |
  | `showBreadcrumbs: false` | Apenas título + descrição |
  | Breadcrumbs custom | Prioridade sobre automáticos |

## API Pública (Hooks)

### `useSetPageMetadata` (Baixo Nível)
Define metadados completos.

```tsx
import { useSetPageMetadata } from "@/contexts/page-metadata";

useSetPageMetadata({
  title: "Dashboard",
  description: "Visão geral da atividade.",
  breadcrumbs: [
    { label: "Início", href: "/dashboard" },
    { label: "Relatórios" }
  ],
  showBreadcrumbs: false // Opcional (default: true)
});
```

### `usePageConfig` (Recomendado – Alto Nível)
Sobrecargas para DX superior.

```tsx
import { usePageConfig } from "@/hooks/use-page-config";

// 1. Título + descrição auto (breadcrumbs automáticos)
usePageConfig("Dashboard", "Monitore sua atividade.");

// 2. Com breadcrumbs customizados
usePageConfig("Short #123", "Gerencie seu short.", [
  { label: "Shorts", href: "/dashboard/shorts" },
  { label: "Short #123" }
]);

// 3. Objeto completo
usePageConfig({
  title: "Configurações Admin",
  description: "Gerencie planos e usuários.",
  showBreadcrumbs: true
});
```

**Melhor prática**: Chame no corpo do componente ou em `useEffect` para dados assíncronos.

## Exemplos de Uso Real (do Codebase)

### Dashboard (`src/app/(protected)/dashboard/page.tsx`)
```tsx
"use client";
import { useUser } from "@/hooks/use-user";
import { usePageConfig } from "@/hooks/use-page-config";

export default function DashboardPage() {
  const { data: user } = useUser();
  usePageConfig(
    `Olá, ${user?.firstName || "Usuário"}!`,
    "Créditos, shorts e histórico de uso."
  );
  // ...
}
```

### AI Studio (`src/app/(protected)/ai-studio/page.tsx`)
```tsx
usePageConfig({
  title: "AI Studio",
  description: "Gere roteiros e vídeos com IA.",
  breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "AI Studio" }]
});
```

### Short Detalhe (`src/app/(protected)/shorts/[id]/page.tsx` – Inferido)
```tsx
const { data: short } = useShort(params.id);

useEffect(() => {
  if (short) {
    usePageConfig(
      short.title,
      `Status: ${short.status}`,
      [{ label: "Shorts", href: "/dashboard/shorts" }, { label: short.title }]
    );
  }
}, [short]);
```

### Admin Pages (`src/app/admin/settings/page.tsx`)
Usa automáticos para `/admin/settings/plans` → `Admin > Settings > Plans`.

## Funcionalidades Avançadas

### Breadcrumbs Automáticos
- Decompõe `pathname` em hierarquia legível.
- Exemplo: `/dashboard/shorts/abc123` → `Início > Shorts > Short abc123`.
- **Cross-ref**: Implementado em `src/contexts/page-metadata.tsx` com `generateBreadcrumbs(pathname)`.

### Geração Dinâmica + Dados Assíncronos
Sempre em `useEffect` para evitar loops:
```tsx
useEffect(() => {
  if (data) usePageConfig(`Título Dinâmico: ${data.name}`, data.summary);
}, [data]);
```

### i18n Suporte
```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("Page");

{ label: t("dashboard.title"), href: "/dashboard" }
```

## Integrações e Dependências

- **Layouts**: `src/app/(protected)/layout.tsx`, `src/app/admin/layout.tsx`.
- **Utils**: `cn` (`src/lib/utils.ts`), `usePathname` (Next.js).
- **UI**: `src/components/ui/breadcrumbs.tsx`.
- **Usos no codebase** (via análise):
  - 10+ páginas em `(protected)` e `admin`.
  - Dependências: `use-agents.ts`, `use-shorts.ts`, `use-dashboard.ts`.

## Migração de Páginas Legadas

1. Adicione `"use client";`.
2. Remova manual `<h1>`, `<p>`, `<BreadcrumbNav />`.
3. Substitua por `usePageConfig`.
4. Teste com `showBreadcrumbs: false`.

**Antes/Depois**:
```tsx
// Antes
<h1>Dashboard</h1>
<p>Visão geral...</p>

// Depois
usePageConfig("Dashboard", "Visão geral...");
```

**Páginas migradas**:
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/ai-studio/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/(protected)/agents/[slug]/page.tsx`

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Header invisível | Fora de `PageMetadataProvider` | Verifique layout `(protected)`. |
| Breadcrumbs incorretos | Pathname complexo | Forneça `breadcrumbs` manual. |
| Re-renders infinitos | Chamada fora `useEffect` | Mova para `useEffect`. |
| Conflito SEO | UI vs `<head>` | Use `generateMetadata()` para SEO. |
| SSR erro | Client-only | `"use client";` obrigatório. |
| Admin não funciona | Sem provedor | Adicione em `src/app/admin/layout.tsx`. |

## Implementação Interna (Contribuições)

- **Estado**: `useState<PageMetadataState>` + `useCallback` para updates.
- **Automático**:
  ```tsx
  const autoBreadcrumbs = useMemo(() => {
    // Lógica de split(pathname) + labels hardcoded/mappeds
  }, [pathname]);
  ```
- **Extensões**:
  - Ícones: `icon?: LucideIcon`.
  - OpenGraph: Integre com `next-seo`.

**Repo refs**:
- [Contexto](src/contexts/page-metadata.tsx)
- [Header](src/components/app/page-header.tsx)
- [Hook](src/hooks/use-page-config.ts)

Para feedback, edite este doc ou abra issue! 🚀
