# Brand Configuration

Centralized brand settings are defined in [`src/lib/brand-config.ts`](https://github.com/your-org/pedro-ai/blob/main/src/lib/brand-config.ts). This file exports a `site` configuration object and an `AnalyticsConfig` type, allowing you to customize your app's name, metadata, assets, social links, and analytics in one place. Changes here propagate across the app without manual updates elsewhere.

## Configuration Structure

The primary export is a `site` object with the following structure:

```typescript
// src/lib/brand-config.ts (inferred structure from exports)
export const site = {
  name: 'Your App Name',
  shortName: 'App',
  description: 'App description for SEO.',
  keywords: 'keyword1, keyword2',
  author: 'Your Name/Company',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com',
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
    twitter: 'https://twitter.com/yourhandle',
    linkedin: 'https://linkedin.com/company/yourcompany',
  },
  support: {
    email: 'support@yourapp.com',
    url: 'https://yourapp.com/support',
  },
} as const;

export type AnalyticsConfig = {
  gtmId?: string;
  gaId?: string;
  facebookPixelId?: string;
};
```

- **LogoPaths**: `{ light: string; dark: string }` – Paths to light/dark mode logos in `/public`.
- **IconPaths**: `{ favicon: string; apple: string }` – Favicon and Apple touch icon paths.
- **AnalyticsConfig**: Optional IDs for Google Tag Manager (GTM), Google Analytics 4 (GA4), and Meta Pixel.

## Environment Variables

Configure these in `.env.local` (see `.env.example` for format):

```env
NEXT_PUBLIC_APP_URL=https://yourapp.com
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX  # Optional: Google Tag Manager
NEXT_PUBLIC_GA_ID=G-XXXXXX     # Optional: GA4 Measurement ID
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345  # Optional: Meta Pixel
```

These are injected at build time and used in `analytics` config.

## Usage Locations

The config is consumed in key areas for consistency:

| Location | Usage | Example |
|----------|--------|---------|
| [`src/app/layout.tsx`](src/app/layout.tsx) | Root `<title>`, `<meta>` tags, OpenGraph | `title: site.name`, `description: site.description`, `openGraph.images: [site.ogImage]` |
| Header/Footer Components | Branding display | `<h1>{site.name}</h1>`, `<img src={site.logo.light} />` |
| Metadata Contexts | Page SEO (`src/contexts/page-metadata.tsx`) | `BreadcrumbItem` uses `site.name` |
| Analytics | Global tracking (`AnalyticsPixels` or similar) | Loads GTM/GA4/Pixel scripts via `analytics.gtmId` etc. |

**Import Example**:
```tsx
// Anywhere in the app
import { site, analytics } from '@/lib/brand-config';

export default function Header() {
  return (
    <header>
      <img src={site.logo.dark} alt={site.name} />
      <h1>{site.shortName}</h1>
    </header>
  );
}
```

## Asset Management

Place static assets in `/public/` and reference them relatively:

```
/public
├── logo-light.svg
├── logo-dark.svg
├── favicon.ico
├── apple-touch-icon.png
└── og-image.png (1200x630px recommended)
```

Update paths in `brand-config.ts`. Assets are served at root URL (e.g., `https://yourapp.com/logo-light.svg`).

## Customization Guide

1. **Rebrand Quickly**:
   - Update `name`, `shortName`, `description`, `keywords`.
   - Swap logos/icons/ogImage paths.
   - Add social/support links.

2. **Extend the Config**:
   ```typescript
   // Add to site object
   pricing: {
     monthly: '$29',
     yearly: '$290',
   },
   legal: {
     privacy: '/privacy',
     terms: '/terms',
   },
   ```
   Consume: `site.pricing.monthly`.

3. **Analytics Setup**:
   - Enable via env vars.
   - Config auto-injects `<script>` tags in `<head>`.

4. **SEO Best Practices**:
   - Keep `description` < 160 chars.
   - Use unique `ogImage` per major page if needed (override in page metadata).

## Related Files & Symbols

- **Exports**:
  - `AnalyticsConfig` (type) – Analytics IDs.
- **Dependencies**: Minimal; uses `process.env`.
- **Search Results**: Imported in layout, metadata, header/footer (use `grep -r "brand-config"` or IDE search).
- **Tests/Examples**: No dedicated tests; verify via app preview.

## Troubleshooting

- **Logo not showing?** Check `/public` paths and browser dev tools network tab.
- **Analytics not firing?** Inspect `<head>` for script tags; ensure env vars prefixed `NEXT_PUBLIC_`.
- **SEO issues?** Run Lighthouse audit; validate OpenGraph with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

For production deploys (Vercel/Netlify), set env vars in dashboard. Changes require rebuild.
