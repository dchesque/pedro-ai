# Brand Configuration

Centralized brand settings are defined in [`src/lib/brand-config.ts`](../src/lib/brand-config.ts). This module exports a `site` configuration object and an `AnalyticsConfig` type, enabling easy customization of the app's name, metadata, assets, social links, and analytics. Updates here automatically propagate throughout the application.

## Exports

| Symbol | Type | Description |
|--------|------|-------------|
| `site` | `const object` | Core brand configuration object with name, logos, socials, etc. |
| `LogoPaths` | `interface` | `{ light: string; dark: string }` – Paths to light/dark mode logos. |
| `IconPaths` | `interface` | `{ favicon: string; apple: string }` – Favicon and Apple touch icon paths. |
| `AnalyticsConfig` | `type` | `{ gtmId?: string; gaId?: string; facebookPixelId?: string; }` – Optional analytics tracking IDs. |

## Configuration Structure

```typescript
// src/lib/brand-config.ts
export const site = {
  name: 'Pedro AI',
  shortName: 'Pedro',
  description: 'AI-powered short video creation platform.',
  keywords: 'ai, video, shorts, characters, scripts',
  author: 'Pedro AI Team',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pedro.ai',
  logo: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  } as LogoPaths,
  icons: {
    favicon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  } as IconPaths,
  ogImage: '/og-image.png',
  socials: {
    twitter: 'https://twitter.com/pedroai',
    linkedin: 'https://linkedin.com/company/pedro-ai',
  },
  support: {
    email: 'support@pedro.ai',
    url: 'https://pedro.ai/support',
  },
} as const;
```

## Environment Variables

Set these in `.env.local` (reference `.env.example`):

```env
NEXT_PUBLIC_APP_URL=https://pedro.ai
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX    # Optional: Google Tag Manager
NEXT_PUBLIC_GA_ID=G-XXXXXX       # Optional: Google Analytics 4
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345  # Optional: Meta Pixel
```

These are referenced in `brand-config.ts` and injected at build time.

## Usage Examples

### Importing and Using Config
```tsx
// Example: src/components/app/Header.tsx or similar
import { site } from '@/lib/brand-config';

export function Header() {
  return (
    <header className="flex items-center gap-4">
      <img 
        src={site.logo.dark} 
        alt={`${site.name} logo`} 
        className="h-8 w-auto"
      />
      <h1 className="text-2xl font-bold">{site.name}</h1>
    </header>
  );
}
```

### In Layout/Metadata
```tsx
// src/app/layout.tsx (inferred usage)
export const metadata = {
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.author }],
  openGraph: {
    images: [site.ogImage],
    type: 'website',
  },
};
```

### Analytics Integration
Analytics scripts (GTM, GA4, Pixel) are typically loaded via `AnalyticsConfig` in a provider or layout component (e.g., `src/contexts/analytics.tsx` or `src/app/layout.tsx`).

```tsx
// Hypothetical analytics setup
import { analytics } from '@/lib/brand-config'; // if exported separately

if (analytics.gtmId) {
  // Load GTM script
}
```

## Asset Locations

Static assets are served from `/public/`:

```
/public
├── logo-light.svg      (light mode logo)
├── logo-dark.svg       (dark mode logo)
├── favicon.ico
├── apple-touch-icon.png (180x180px)
└── og-image.png        (1200x630px recommended for OpenGraph)
```

Reference relatively: `/logo-light.svg` → `https://pedro.ai/logo-light.svg`.

## Customization Steps

1. **Update Branding**:
   - Edit `name`, `shortName`, `description`, `keywords`, `author`.
   - Replace asset paths in `logo`, `icons`, `ogImage`.

2. **Add Social/Support Links**:
   ```typescript
   socials: {
     twitter: 'https://x.com/newhandle',
     instagram: 'https://instagram.com/newaccount', // Extend as needed
   },
   ```

3. **Extend Config** (non-breaking):
   ```typescript
   // Add custom properties
   features: {
     aiStudio: true,
     shorts: true,
   },
   colors: {
     primary: '#3B82F6',
   },
   ```
   Update TypeScript types accordingly.

4. **Analytics**:
   - Add env vars.
   - Verify scripts in browser dev tools (`<head>`).

## Known Usages in Codebase

- **Layout/Metadata**: `src/app/layout.tsx`, `src/contexts/page-metadata.tsx` (titles, OG tags, breadcrumbs).
- **UI Components**: Headers, footers, marketing pages (e.g., `src/components/app/app-shell.tsx`, `src/components/marketing/ai-starter.tsx`).
- **Admin Pages**: `src/app/admin/layout.tsx`, `src/components/admin/admin-chrome.tsx`.
- **Search Pattern**: Imported ~10-15 times (e.g., `grep -r "from.*brand-config" src/`).

No direct tests found; validate via local dev server (`pnpm dev`) and Lighthouse audits.

## Best Practices

- **SEO**: `<160 chars` for `description`; unique OG images per page.
- **Performance**: Optimize SVGs (<10KB); use Next.js `<Image>` for logos.
- **Consistency**: Always import from `brand-config.ts` – no hard-coded strings.
- **Dark Mode**: Test logo switching with `prefers-color-scheme`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Logos missing | Verify `/public/` paths; check Network tab. |
| Analytics not tracking | Confirm `NEXT_PUBLIC_*` env vars; inspect `<head>`. |
| SEO validation fails | Use [Facebook Debugger](https://developers.facebook.com/tools/debug/), [Google Rich Results](https://search.google.com/test/rich-results). |
| Build errors | Restart dev server after env/logo changes. |

## Related Files

- [`src/app/layout.tsx`](../src/app/layout.tsx) – Root metadata consumer.
- [`src/contexts/page-metadata.tsx`](../src/contexts/page-metadata.tsx) – Dynamic page SEO.
- [`.env.example`](../.env.example) – Env var template.
- [Public assets](../public/) – Logos, icons, OG image.

For deploys (Vercel, etc.), set env vars in platform dashboard. Rebuild required for changes.
