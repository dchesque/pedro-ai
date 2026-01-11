# Backend Documentation

## Overview

The backend is built with Next.js API routes, providing a serverless architecture with full-stack capabilities. It integrates with PostgreSQL through Prisma ORM and uses Clerk for authentication.

## Core Technologies

- **Next.js API Routes**: Serverless backend endpoints
- **Prisma ORM**: Type-safe database client
- **PostgreSQL**: Relational database
- **Clerk**: Authentication and user management
- **Zod**: Runtime validation
- **TypeScript**: Type safety

## API Architecture

### Route Structure

```
app/api/
├── credits/
│   └── me/
│       └── route.ts        # GET /api/credits/me
├── users/
│   ├── route.ts           # GET /api/users, POST /api/users
│   └── [id]/
│       └── route.ts       # GET /api/users/[id]
├── health/
│   └── route.ts           # GET /api/health
└── webhooks/
    └── clerk/
        └── route.ts       # POST /api/webhooks/clerk
```

### API Route Pattern

Every API route follows this standard pattern:

```ts
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

export async function GET() {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. Get database user
    const user = await getUserFromClerkId(userId);

    // 3. Fetch data with proper authorization
    const data = await db.someModel.findMany({
      where: { userId: user.id },
    });

    // 4. Return response
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### HTTP Methods

#### GET - Read Data
```ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await db.model.findUnique({
    where: { id: params.id },
  });

  return NextResponse.json(data);
}
```

#### POST - Create Data
```ts
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Validate input
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  });

  const validatedData = schema.parse(body);

  const user = await getUserFromClerkId(userId);
  const created = await db.model.create({
    data: {
      ...validatedData,
      userId: user.id,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
```

#### PUT - Update Data
```ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Verify ownership
  const user = await getUserFromClerkId(userId);
  const existing = await db.model.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await db.model.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}
```

#### DELETE - Remove Data
```ts
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromClerkId(userId);
  
  // Verify ownership
  const existing = await db.model.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.model.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
```

## Data Validation

### Input Validation with Zod

```ts
// lib/validations.ts
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(18, 'Must be at least 18'),
});

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const validatedData = createUserSchema.parse(body);
    // Proceed with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      );
    }
  }
}
```

### Response Schemas

```ts
// lib/api-types.ts
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  success: boolean;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Usage
function createResponse<T>(data: T): ApiResponse<T> {
  return { data, success: true };
}
```

## Error Handling

### Standard Error Responses

```ts
// lib/api-errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        issues: error.issues,
        success: false 
      },
      { status: 400 }
    );
  }

  console.error('Unexpected API error:', error);
  return NextResponse.json(
    { error: 'Internal server error', success: false },
    { status: 500 }
  );
}
```

### Usage in Routes

```ts
export async function POST(request: Request) {
  try {
    // API logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Database Operations

### Connection Management

```ts
// lib/db.ts
// If you set a custom Prisma client output, import from that path
import { PrismaClient } from '../../prisma/generated/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

### Query Patterns

#### Simple Queries
```ts
// Find by ID
const user = await db.user.findUnique({
  where: { id: userId },
});

// Find many with filters
const usage = await db.usageHistory.findMany({
  where: { userId: user.id },
  orderBy: { timestamp: 'desc' },
  take: 20,
});
```

#### Complex Queries with Relations
```ts
const usageWithDetails = await db.usageHistory.findFirst({
  where: { userId: user.id },
  include: {
    creditBalance: true,
    user: true,
  },
});
```

#### Transactions
```ts
const result = await db.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { name: 'John', email: 'john@example.com' },
  });

  await tx.creditBalance.create({
    data: {
      userId: user.id,
      creditsRemaining: 100,
    },
  });

  return user;
});
```

## Middleware

### Authentication Middleware

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Additional middleware logic
  return NextResponse.next();
});
```

## Webhooks

### Clerk Webhooks

```ts
// app/api/webhooks/clerk/route.ts
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const payload = await request.json();
  const event = payload as WebhookEvent;

  switch (event.type) {
    case 'user.created':
      await db.user.create({
        data: {
          clerkId: event.data.id,
          email: event.data.email_addresses[0]?.email_address,
          name: `${event.data.first_name} ${event.data.last_name}`,
        },
      });
      break;

    case 'user.updated':
      await db.user.update({
        where: { clerkId: event.data.id },
        data: {
          email: event.data.email_addresses[0]?.email_address,
          name: `${event.data.first_name} ${event.data.last_name}`,
        },
      });
      break;

    case 'user.deleted':
      await db.user.delete({
        where: { clerkId: event.data.id },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

### User CRUD Webhook

External identity providers (or internal admin systems) can sync user lifecycle events via `POST /api/webhooks/users`.

- Verification: the handler expects `x-webhook-signature`/`x-webhook-timestamp` headers. The signature is an HMAC SHA-256 digest of `${timestamp}.${rawBody}` using a configured secret.
- Payload: either a single event or `{ "events": [...] }`, where every event has `type` (`user.created|user.updated|user.deleted`) and `data.id` (mapped to `User.clerkId`). Optional fields (`email`, `firstName`, `lastName`, `name`, `isActive`) update the corresponding columns.
- Credit fields:
  - `initialCredits`: legacy absolute setter (still accepted).
  - `creditsRemaining`: preferred absolute setter for the `CreditBalance`.
  - `creditDelta`: relative adjustment (positive/negative). Balances never go below zero, and a missing `CreditBalance` row is created on demand.
- Behavior:
  - `user.created`: idempotently creates the user and ensures a `CreditBalance` row exists (default 0 credits unless `initialCredits` is provided).
  - `user.updated`: syncs any provided fields; if the user cannot be found it will be created so retries can arrive out of order. Credit fields apply atomically in the same transaction.
  - `user.deleted`: removes dependent rows in a transaction (usage history, storage objects, credit balances) before deleting the user itself.
- Responses:
  - `200` with `{ processed: <count> }` when all events succeed
  - `401` when signature/timestamp verification fails
  - `422` when validation fails (invalid structure or missing fields)


### Planos, Pagamentos e Créditos

O sistema de faturamento foi desenhado para ser flexível, combinando gerenciamento manual de planos com a automação de pagamentos através do Asaas.

#### Gerenciamento de Planos
- **Manual via Admin**: Todos os planos de assinatura são criados e configurados no painel de administração (`/admin/settings/plans`).
- **APIs de Gerenciamento**: As operações de CRUD para os planos são expostas através dos endpoints `GET /api/admin/plans`, `POST /api/admin/plans`, `PUT /api/admin/plans/:id`, e `DELETE /api/admin/plans/:id`.
- **Flexibilidade**: Não há planos "hard-coded". O administrador pode definir nomes, preços, créditos associados e status (ativo/inativo) para cada plano.

#### Integração com Asaas para Pagamentos
- **Provedor de Pagamento**: O Asaas é o processador de pagamentos para as assinaturas.
- **Checkout**: Ao escolher um plano, o usuário pode ser direcionado para um link de checkout do Asaas (configurado no plano) para realizar o pagamento.
- **Webhooks de Pagamento**: O backend expõe um endpoint em `POST /api/webhooks/asaas` para receber notificações de pagamento do Asaas.
  - Quando um evento como `PAYMENT_CONFIRMED` é recebido, o sistema valida a notificação, identifica o usuário e o plano correspondente, e libera os créditos da assinatura.

#### Sistema de Créditos
- **Concessão de Créditos**: Os créditos são concedidos ao usuário após a confirmação do pagamento da assinatura via webhook do Asaas. A quantidade de créditos é baseada no plano que foi adquirido.
- **Validação e Consumo**:
  - Antes de executar uma ação que consome créditos (ex: gerar uma imagem com IA), o backend utiliza a função `validateCreditsForFeature` para verificar se o usuário tem saldo suficiente.
  - Após a execução bem-sucedida, `deductCreditsForFeature` é chamada para debitar os créditos de forma transacional e registrar a operação no histórico de uso.
- **Segurança**: A lógica de validação e dedução de créditos é centralizada no backend para garantir que o saldo seja a única fonte de verdade, prevenindo manipulação pelo cliente.

#### Sincronização de Admin (Comportamento Atual)
- O endpoint `POST /api/admin/users/sync` agora foca exclusivamente na sincronização de dados de usuários do Clerk para o banco de dados local.
- As opções relacionadas a `syncPlans` e `setCredits` baseadas em planos do Clerk foram removidas, pois o gerenciamento de planos é manual.

## Caching

### Database Query Caching

```ts
// lib/cache.ts
const cache = new Map();

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

// Usage
const users = await withCache(
  'users',
  () => db.user.findMany(),
  5 * 60 * 1000 // 5 minutes
);
```

## Background Jobs

### Simple Queue Implementation

```ts
// lib/queue.ts
type Job<T = any> = {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
};

class SimpleQueue {
  private jobs: Job[] = [];
  private processing = false;

  add<T>(type: string, payload: T, maxAttempts = 3) {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
    };

    this.jobs.push(job);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      
      try {
        await this.executeJob(job);
      } catch (error) {
        job.attempts++;
        if (job.attempts < job.maxAttempts) {
          this.jobs.push(job);
        }
      }
    }

    this.processing = false;
  }

  private async executeJob(job: Job) {
    switch (job.type) {
      case 'SEND_EMAIL':
        await this.sendEmail(job.payload);
        break;
      case 'PROCESS_PAYMENT':
        await this.processPayment(job.payload);
        break;
    }
  }
}
```

## Performance Optimization

### Database Optimization

```ts
// Use select to limit fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// Use cursors for pagination
const storageObjects = await db.storageObject.findMany({
  take: 10,
  cursor: lastStorageId ? { id: lastStorageId } : undefined,
  orderBy: { createdAt: 'desc' },
});

// Use database indexes
// In Prisma schema:
// @@index([userId])
// @@index([createdAt])
```

### Response Optimization

```ts
// Stream responses for large data
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Stream data chunks
      controller.enqueue(JSON.stringify({ chunk: 1 }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Security Best Practices

### Input Sanitization

```ts
// Always validate and sanitize input
const sanitizedInput = input.trim().toLowerCase();
const validated = schema.parse(sanitizedInput);
```

### SQL Injection Prevention

```ts
// Prisma automatically prevents SQL injection
// ✅ Safe
const user = await db.user.findUnique({
  where: { email: userInput },
});

// ❌ Never use raw queries with user input
// const users = await db.$queryRaw`SELECT * FROM User WHERE email = ${userInput}`;
```

### Rate Limiting

```ts
// lib/rate-limit.ts
const requests = new Map<string, number[]>();

export function rateLimit(ip: string, limit: number, window: number) {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];
  
  // Remove old requests
  const validTimestamps = timestamps.filter(
    timestamp => now - timestamp < window
  );

  if (validTimestamps.length >= limit) {
    throw new ApiError('Rate limit exceeded', 429);
  }

  validTimestamps.push(now);
  requests.set(ip, validTimestamps);
}
```

## Testing

### API Route Testing

```ts
// __tests__/api/users.test.ts
import { POST } from '@/app/api/users/route';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@clerk/nextjs/server');

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates user successfully', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });
    (db.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test User',
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Test User');
  });
});
```

## Monitoring

### Error Logging

```ts
// lib/logger.ts
export function logError(error: Error, context?: any) {
  console.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
  }
}
```

### Health Checks

```ts
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
      { status: 503 }
    );
  }
}
```
