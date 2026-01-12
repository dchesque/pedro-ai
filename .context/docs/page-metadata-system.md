# Sistema de Metadados de Página

## Visão Geral

O sistema de metadados de página é um mecanismo centralizado e reativo para gerenciar títulos (`title`), descrições (`description`) e breadcrumbs em páginas protegidas da aplicação. Ele utiliza React Context (`src/contexts/page-metadata.tsx`) para propagar metadados de forma eficiente, evitando prop drilling e garantindo consistência visual.

**Localizações principais:**
- **Contexto principal**: `src/contexts/page-metadata.tsx` (exporta `BreadcrumbItem`, provedor e hooks)
- **Header de renderização**: `src/components/app/page-header.tsx` (renderiza automaticamente no layout protegido)
- **Hooks utilitários**: `src/hooks/use-page-config.ts` (wrapper simplificado sobre `useSetPageMetadata`)

O sistema é ativado apenas em rotas protegidas (dentro de `AppShell` em `src/components/app/app-shell.tsx`), integrando-se perfeitamente com o layout principal.

## Componentes Principais

### 1. `PageMetadataProvider`
- **Propósito**: Provedor de contexto que gerencia o estado global dos metadados.
- **Uso**: Envolve o layout protegido (`src/app/(protected)/layout.tsx`).
- **Estado interno**:
  ```tsx
  interface PageMetadataState {
    title?: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    showBreadcrumbs?: boolean;
  }
  ```
- **Comportamento**:
  - Merge de múltiplas chamadas de `useSetPageMetadata` (última prevalece).
  - Geração automática de breadcrumbs se não fornecidos (baseado em `usePathname` do Next.js).
  - Memoização para evitar re-renderizações desnecessárias.

### 2. `PageHeader`
- **Propósito**: Componente que consome o contexto e renderiza:
  1. Breadcrumbs (usando `src/components/ui/breadcrumbs.tsx`).
  2. Título (`<h1>`).
  3. Descrição (`<p>`).
- **Renderização condicional**:
  | Condição | Renderiza |
  |----------|-----------|
  | Sem metadados | Nada |
  | Apenas breadcrumbs | Apenas breadcrumbs |
  | Título/descrição | Header completo |
  | `showBreadcrumbs: false` | Sem breadcrumbs |
- **Integração**: Incluído automaticamente em `src/app/(protected)/layout.tsx`.

### 3. Tipos Exportados
```tsx
// src/contexts/page-metadata.tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
```

## API dos Hooks

### `useSetPageMetadata`
Hook de baixo nível para definir metadados completos.

```tsx
import { useSetPageMetadata } from "@/contexts/page-metadata";

useSetPageMetadata({
  title: "Meu Título",
  description: "Descrição detalhada da página.",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Relatórios" },
    { label: "Vendas 2024", href: "/dashboard/reports/sales-2024" }
  ],
  showBreadcrumbs: true // padrão: true
});
```

### `usePageConfig` (Recomendado)
Wrapper simplificado com sobrecargas para DX otimizado.

```tsx
import { usePageConfig } from "@/hooks/use-page-config";

// 1. Simples (título + descrição auto)
usePageConfig("Dashboard", "Visão geral da sua atividade");

// 2. Com breadcrumbs
usePageConfig("Relatórios", "Análises detalhadas", [
  { label: "Início", href: "/dashboard" },
  { label: "Relatórios" }
]);

// 3. Objeto completo
usePageConfig({
  title: "Configurações",
  description: "Personalize sua conta",
  showBreadcrumbs: false
});
```

**Nota**: Chame no topo do componente da página (depois de `useEffect` se dependente de dados assíncronos).

## Recursos Avançados

### Breadcrumbs Automáticos
- **Como funciona**: Usa `usePathname()` para decompor a URL em breadcrumbs hierárquicos.
- **Exemplo de saída automática** para `/dashboard/shorts/123`:
  ```
  Início → Shorts → Short #123
  ```
- **Customização**: Sobrescreva fornecendo `breadcrumbs` explícitos.

### Geração Dinâmica
Integre com dados carregados:
```tsx
export default function ShortPage({ params }: { params: { id: string } }) {
  const { data: short } = useShort(params.id);
  
  useEffect(() => {
    if (short) {
      usePageConfig(
        `Short: ${short.title}`,
        `Status: ${short.status}`,
        [{ label: "Shorts", href: "/dashboard/shorts" }, { label: short.title }]
      );
    }
  }, [short]);
  
  return <ShortContent />;
}
```

### Suporte a Internacionalização (i18n)
- Labels de breadcrumbs são strings puras; integre com `next-intl` ou similar:
  ```tsx
  { label: t("dashboard.title") }
  ```

## Exemplos de Uso em Páginas Reais

### Dashboard (`src/app/(protected)/dashboard/page.tsx`)
```tsx
"use client";
import { useUser } from "@/hooks/use-user";
import { usePageConfig } from "@/hooks/use-page-config";

export default function DashboardPage() {
  const { user } = useUser();
  usePageConfig(
    `Olá, ${user?.firstName}!`,
    "Monitore créditos, shorts e uso da IA."
  );
  // Conteúdo...
}
```

### AI Studio (`src/app/(protected)/ai-studio/page.tsx`)
```tsx
usePageConfig({
  title: "AI Studio",
  description: "Crie roteiros e vídeos com IA avançada",
  breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "AI Studio" }]
});
```

### Admin Settings (`src/app/admin/settings/page.tsx`)
Usa breadcrumbs automáticos para rotas aninhadas como `/admin/settings/plans`.

## Migração de Páginas Existentes

**Passos obrigatórios:**
1. Adicione `"use client";` no topo.
2. Remova `<BreadcrumbNav />`, `<h1>`, `<p className="text-muted-foreground">`.
3. Importe e chame `usePageConfig`.
4. Teste em modo dev (`showBreadcrumbs: false` para debug).

**Exemplo Antes/Depois**:
```tsx
// ANTES (legado)
<BreadcrumbNav items={[]} />
<h1>Título Antigo</h1>
<p>Descrição antiga...</p>

// DEPOIS
"use client";
import { usePageConfig } from "@/hooks/use-page-config";

usePageConfig("Título Antigo", "Descrição antiga...");
```

**Páginas já migradas** (exemplos do codebase):
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/(protected)/ai-studio/page.tsx`

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Header não aparece | Página fora do layout protegido | Mova para `(protected)` ou adicione provedor manualmente. |
| Breadcrumbs errados | URL complexa | Forneça `breadcrumbs` customizados. |
| Re-renderizações excessivas | Chamada fora de `useEffect` | Use `useEffect` para dados assíncronos. |
| Conflito com SEO `<title>` | Metadados de página vs. header | Use `generateMetadata` para `<head>`, este sistema é só UI. |
| Não funciona em SSR | Hook client-side | Sempre `"use client";`. |

## Implementação Interna (Para Contribuições)

1. **Contexto** (`page-metadata.tsx`):
   ```tsx
   const [metadata, setMetadata] = useState<PageMetadataState>({});
   const updateMetadata = useCallback((newMeta: Partial<PageMetadataState>) => {
     setMetadata(prev => ({ ...prev, ...newMeta }));
   }, []);
   ```
2. **Automático**:
   ```tsx
   const pathname = usePathname();
   const autoBreadcrumbs = useMemo(() => generateBreadcrumbs(pathname), [pathname]);
   ```
3. **PageHeader** usa `useContext(PageMetadataContext)`.

**Extensões sugeridas**:
- Suporte a ícones por breadcrumb.
- Open Graph integration.

## Benefícios

- ✅ **Consistência**: UI uniforme sem duplicação.
- ✅ **Manutenibilidade**: Altere `PageHeader` uma vez.
- ✅ **Performance**: Memoizado, atualizações locais.
- ✅ **Flexível**: Auto/custom, condicional.
- ✅ **TypeScript**: Tipos rigorosos (`BreadcrumbItem`).

Para issues ou melhorias, abra PR em `src/contexts/page-metadata.tsx`.
