# Authentication

## Overview

This application uses **Clerk** for user authentication, providing social logins, user profiles, session management, and webhook synchronization with the local database. Authentication is enforced via Next.js middleware, client-side hooks, and server-side utilities. API routes use key-based auth for machine-to-machine calls.

Key files:
- `src/lib/auth-utils.ts` - User sync and validation helpers
- `src/lib/api-auth.ts` - API key validation and responses
- `src/lib/api-client.ts` - Authenticated client for internal API calls
- `middleware.ts` - Route protection
- `app/api/webhooks/clerk/route.ts` - User lifecycle sync

## Clerk Setup

### Dependencies
```
@clerk/nextjs  # Client & server components
@clerk/backend # Webhooks & backend ops
```

### Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Root Layout
```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Middleware
Protects routes with Clerk. Public routes bypass auth; others require sign-in.

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  return NextResponse.next(); // Protected by layout
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

Route groups:
- `(public)`: `/`, `/sign-in`, `/sign-up`
- `(protected)`: `/dashboard`, `/admin`, app routes

## Client-Side Auth

### Protected Layout
```tsx
// app/(protected)/layout.tsx
import { useAuth, useEffect } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) redirect('/sign-in');
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <div>Loading...</div>;
  return <>{children}</>;
}
```

### Hooks
Custom hook wrapping Clerk:
```tsx
// Suggested: hooks/use-auth.ts (not present, but recommended)
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

export function useAuth() {
  const clerk = useClerkAuth();
  const { user } = useUser();
  return { ...clerk, user, isAuthenticated: clerk.isLoaded && clerk.isSignedIn };
}
```

**UserButton** example:
```tsx
// components/UserButton.tsx
import { UserButton } from '@clerk/nextjs';

export function UserMenu() {
  return <UserButton afterSignOutUrl="/" />;
}
```

## Server-Side Auth

### Current User
```ts
// From src/lib/auth-utils.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function getUserFromClerkId(clerkId: string) {
  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await db.user.create({ data: { clerkId } });
  }
  return user;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  return userId ? getUserFromClerkId(userId) : null;
}

export async function validateUserAuthentication(userId: string) {
  const user = await getUserFromClerkId(userId);
  if (!user) throw createAuthErrorResponse('User not found');
  return user;
}
```

### API Protection
```ts
// app/api/example/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getCurrentUser();
  // Business logic...
  return NextResponse.json({ data: 'protected' });
}
```

## API Key Auth (Internal APIs)
For client-side API calls without Clerk sessions:

```ts
// src/lib/api-auth.ts
export function validateApiKey(key: string | undefined) {
  if (!key || key !== process.env.API_KEY) {
    throw createUnauthorizedResponse();
  }
}

// src/lib/api-client.ts
export const apiClient = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', headers: () => ({ Authorization: `Bearer ${process.env.API_KEY}` }) })],
});
```

Middleware example:
```ts
// For public API endpoints
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  validateApiKey(authHeader?.replace('Bearer ', '')); // Throws if invalid
  // Proceed
}
```

## Admin Access
```ts
// src/lib/admin.ts
export function requireAdmin(userId: string) {
  // Check metadata or role
}

// src/lib/admin-utils.ts
export function isAdmin(user: any): boolean {
  return user?.publicMetadata?.isAdmin === true;
}
```

Usage:
```ts
const user = await currentUser();
if (!isAdmin(user)) throw new Error('Admin required');
```

## Webhooks (User Sync)
Syncs Clerk ↔ DB on lifecycle events.

```ts
// app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const evt = auth().verifyRequest(req);
  switch (evt.type) {
    case 'user.created': await handleUserCreated(evt); break;
    case 'user.updated': await handleUserUpdated(evt); break;
    case 'user.deleted': await handleUserDeleted(evt); break;
  }
  return NextResponse.json({ received: true });
}
```

Handlers create/update/delete `User` & `CreditBalance`. Cascades deletions.

**Alternative**: `/api/webhooks/users` for custom sync (batched, signed payloads).

## Custom Pages
```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return <SignIn redirectUrl="/dashboard" />;
}
```
Similar for `SignUp`.

## Security & Best Practices
- **Server-first**: Always `await auth()` on APIs/Server Components.
- **Ownership**: Verify `resource.userId === currentUser.id`.
- **Rate limits**: On login/signup endpoints.
- **Errors**: Use `createAuthErrorResponse()` for consistent 401s.
- **Metadata**: Store roles in Clerk `publicMetadata` (e.g., `{ isAdmin: true }`).
- **Testing**: Mock `@clerk/nextjs/server` in Vitest.

## Related Files
| Purpose | File |
|---------|------|
| User utils | `src/lib/auth-utils.ts` |
| API auth | `src/lib/api-auth.ts` |
| Admin checks | `src/lib/admin.ts`, `src/lib/admin-utils.ts` |
| Client | `src/lib/api-client.ts` |

For Clerk docs: [clerk.com/docs](https://clerk.com/docs).
