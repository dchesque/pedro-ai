# Authentication

## Overview

This Next.js application uses **Clerk** for comprehensive user authentication, including social logins (Google, etc.), email/password, user profiles, session management, and real-time synchronization with the Prisma database via webhooks. Authentication is layered:

- **Middleware**: Route-level protection for protected paths.
- **Client-side**: `<ClerkProvider>`, hooks like `useAuth`, `<UserButton>`.
- **Server-side**: `auth()` from `@clerk/nextjs/server`, user sync utilities.
- **API routes**: Clerk sessions or API key-based auth for internal/machine calls.
- **Admin**: Role-based checks via `publicMetadata`.

Public routes (home, sign-in/up) bypass auth. Protected routes (dashboard, admin, AI studio) require sign-in.

### Key Files
| Purpose | File/Path |
|---------|-----------|
| User sync & validation | `src/lib/auth-utils.ts` |
| API key auth & responses | `src/lib/api-auth.ts` |
| Internal API client | `src/lib/api-client.ts` |
| Admin checks | `src/lib/admin.ts`, `src/lib/admin-utils.ts` |
| Middleware | `middleware.ts` |
| Webhooks | `app/api/webhooks/clerk/route.ts` |
| Layouts | `app/layout.tsx`, `app/(protected)/layout.tsx` |
| Sign-in/up pages | `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` |

**Dependencies**:
```
npm i @clerk/nextjs @clerk/backend
```

## Environment Variables

```env
# Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redirects (customize as needed)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Internal API (optional, for client-side calls)
API_KEY=your-secret-api-key
```

## Setup

### Root Layout (`app/layout.tsx`)
Wraps the app with `<ClerkProvider>`:

```tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Middleware (`middleware.ts`)
Protects non-public routes:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (publicRoutes(req)) return NextResponse.next();
  // All others protected via layouts/hooks
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

Route groups:
- `(public)`: Marketing, auth pages.
- `(protected)`: `/dashboard`, `/admin`, `/ai-studio`, agents, shorts.

## Client-Side Authentication

### Protected Layout (`app/(protected)/layout.tsx`)
Redirects unauthenticated users:

```tsx
'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <div>Carregando...</div>;
  if (!isSignedIn) return null;
  return <>{children}</>;
}
```

### Custom Auth Hook
Recommended wrapper (add to `src/hooks/use-auth.ts` if missing):

```tsx
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

export function useAuth() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useClerkAuth();
  const { user } = useUser();
  return {
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
    user,
    getToken,
  };
}
```

### UserButton Component
Reusable profile menu:

```tsx
// src/components/UserMenu.tsx
'use client';
import { UserButton } from '@clerk/nextjs';
import { useAuth } from '@/hooks/use-auth';

export function UserMenu() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return null;
  return <UserButton afterSignOutUrl="/" />;
}
```

Usage in `AppShell` or topbar:
```tsx
<Topbar>
  <UserMenu />
</Topbar>
```

### Custom Sign-In/Up Pages
```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn redirectUrl="/dashboard" />;
}
```
Same for `SignUp`.

## Server-Side Authentication

### Core Utilities (`src/lib/auth-utils.ts`)
Syncs Clerk ID ↔ DB `User`:

```ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { createAuthErrorResponse } from './auth-utils';

export async function getUserFromClerkId(clerkId: string) {
  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await db.user.create({ data: { clerkId } });
  }
  return user;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return getUserFromClerkId(userId);
}

export async function validateUserAuthentication(userId?: string) {
  if (!userId) throw createAuthErrorResponse('Unauthorized');
  const user = await getUserFromClerkId(userId);
  if (!user) throw createAuthErrorResponse('User not found');
  return user;
}
```

### API Route Protection
Standard pattern:

```ts
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Business logic (e.g., fetch shorts, credits)
  return NextResponse.json({ data: user });
}
```

## API Key Authentication (Machine/Internal Calls)

For client-side API fetches without sessions (e.g., `apiClient` in hooks):

### Utilities (`src/lib/api-auth.ts`)
```ts
export function validateApiKey(key: string | undefined): asserts key is string {
  if (!key || key !== process.env.API_KEY!) {
    throw createUnauthorizedResponse();
  }
}

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
}

export function createSuccessResponse<T>(data: T) {
  return NextResponse.json({ success: true, data });
}
```

Middleware usage:
```ts
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
  validateApiKey(authHeader);
  // Proceed with logic
}
```

### Internal Client (`src/lib/api-client.ts`)
TRPC proxy with baked-in key:
```ts
import { createTRPCProxyClient } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/trpc/router';

export const apiClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers: () => ({ Authorization: `Bearer ${process.env.API_KEY}` }),
    }),
  ],
});
```

Usage in hooks (e.g., `use-credits.ts`):
```ts
const credits = trpc.credits.getCredits.useQuery();
```

## Admin Access

### Checks (`src/lib/admin-utils.ts`, `src/lib/admin.ts`)
```ts
// src/lib/admin-utils.ts
export function isAdmin(user: { publicMetadata: any } | null): boolean {
  return user?.publicMetadata?.isAdmin === true;
}

// src/lib/admin.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { isAdmin } from '@/lib/admin-utils';

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }
  return user;
}
```

Set admin in Clerk dashboard: `user.publicMetadata = { isAdmin: true }`.

Usage in admin routes:
```ts
const user = await requireAdmin();
// Admin logic...
```

Pages like `AdminLayout`, `AdminSettingsPage` use this.

## Webhooks (User Sync)

Handles Clerk events → DB sync (`app/api/webhooks/clerk/route.ts`):

```ts
import { Webhook } from 'svix';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
// Handlers: handleUserCreated, handleUserUpdated, handleUserDeleted

export async function POST(req: Request) {
  const payload = await req.json();
  const headers = req.headers;
  const evt = Webhook(clerkWebhookSecret).verify(payload, headers);
  switch (evt.type) {
    case 'user.created':
      await handleUserCreated(evt.data);
      break;
    // ... updated, deleted (cascade to credits, shorts, etc.)
  }
  return NextResponse.json({ received: true });
}
```

**Handlers** (in file or utils):
- Create `User`, `CreditBalance`.
- Update profile, metadata.
- Delete user + owned resources (shorts, characters).

## Security & Best Practices

- **Ownership**: Always check `resource.userId === currentUser.id` (e.g., in controllers for shorts/agents).
- **Server-first**: Use `await auth()` in Server Components/APIs; client hooks for UI.
- **Errors**: Consistent 401s via `createAuthErrorResponse()` or `createUnauthorizedResponse()`.
- **Roles**: Use Clerk `publicMetadata` for `isAdmin`; sync to DB if needed.
- **Rate Limiting**: Add to `/api` routes (e.g., Upstash Redis).
- **Testing**: Mock `auth()` in Vitest:
  ```ts
  vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn().mockResolvedValue({ userId: 'test_user' }) }));
  ```
- **Troubleshooting**:
  | Issue | Fix |
  |-------|-----|
  | "Invalid CSRF" | Check Clerk keys, domain in dashboard. |
  | Webhook fails | Verify `CLERK_WEBHOOK_SECRET`, event types enabled. |
  | Session mismatch | Clear cookies, check middleware matcher. |
  | API 401 | Validate `API_KEY` env, header format. |

## Integrations

- **Credits**: `use-credits.ts` → `getCurrentUser().id`.
- **Shorts/Agents**: Controllers validate `userId`.
- **Admin**: `use-admin-settings.ts`, `AdminChrome`.
- **Usage Tracking**: Logs `userId` in `use-usage.ts`.

## Related Exports
- `getUserFromClerkId()`, `getCurrentUser()`, `validateUserAuthentication()` (`src/lib/auth-utils.ts`).
- `validateApiKey()`, `apiClient` (`src/lib/api-auth.ts`, `src/lib/api-client.ts`).
- `requireAdmin()`, `isAdmin()`.

[Clerk Docs](https://clerk.com/docs) | [Next.js Clerk Guide](https://clerk.com/docs/quickstarts/nextjs)
