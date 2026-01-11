# Agents Guide

This file is a navigation hub for agents working in this repository. It avoids duplicating content and points you to the authoritative docs and guides.

## Start Here
- [docs/README.md](docs/README.md) — Central documentation index: architecture, backend/frontend, API, auth, database, AI, workflows
- [agents/README.md](agents/README.md) — Agent guides index with checklists and PR deliverables (security, frontend, backend, database, planning, QA)

## Purpose & Scope
- Use this file to quickly find the right guide or reference.
- All detailed standards live under `docs/` and actionable playbooks under `agents/`.
- Scope: applies to the entire repository.

## Key References (authoritative)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Development Guidelines: [docs/development-guidelines.md](docs/development-guidelines.md)
- Frontend: [docs/frontend.md](docs/frontend.md), [docs/components.md](docs/components.md), [docs/page-metadata-system.md](docs/page-metadata-system.md)
- Backend & API: [docs/backend.md](docs/backend.md), [docs/api.md](docs/api.md)
- Authentication: [docs/authentication.md](docs/authentication.md)
- Database & Prisma: [docs/database.md](docs/database.md)
- Credits System: [docs/credits.md](docs/credits.md), [src/lib/credits/feature-config.ts](src/lib/credits/feature-config.ts), [src/lib/credits/deduct.ts](src/lib/credits/deduct.ts)
- Admin QA Guide: [docs/testing/admin-qa-guide.md](docs/testing/admin-qa-guide.md)

## Common Tasks → Guides
- Plan a feature: [agents/architecture-planning.md](agents/architecture-planning.md)
- Build frontend UI: [agents/frontend-development.md](agents/frontend-development.md)
- Implement API/backend: [agents/backend-development.md](agents/backend-development.md)
- Evolve database schema: [agents/database-development.md](agents/database-development.md)
- Security review checklist: [agents/security-check.md](agents/security-check.md)
- QA workflow: [agents/qa-agent.md](agents/qa-agent.md)

## Essentials (quick reminders)
- Database access is server-only. Use Server Components, API routes under `src/app/api/*`, or Server Actions. Details: docs/backend.md
- Prefer typing feature keys: `FeatureKey = keyof typeof FEATURE_CREDIT_COSTS`. See src/lib/credits/feature-config.ts and src/lib/credits/deduct.ts
- Path alias `@/*` → `src/*`. Code style and scripts: docs/development-guidelines.md

## Initial Setup: Environment Variables
**If `.env` file does not exist**, follow these steps:

1. **Configure initial database**:
   - Run `npm run db:docker` to set up a PostgreSQL database via Docker (recommended for local development)
   - The script will output a `DATABASE_URL` that you need to copy
   - Alternatively, configure your own PostgreSQL instance

2. **Create `.env` file**:
   - Copy from `.env.example`: `cp .env.example .env`
   - Add the `DATABASE_URL` environment variable to `.env`:
     ```env
     DATABASE_URL="postgresql://user:password@host:port/database"
     ```
   - Add admin email(s) as environment variable:
     ```env
     ADMIN_EMAILS="admin@yourdomain.com,ops@yourdomain.com"
     ```
     Or use Clerk user IDs:
     ```env
     ADMIN_USER_IDS="usr_123,usr_456"
     ```

3. **After setting up `.env`**:
   - Run `npm run db:push` to sync the database schema
   - Ensure other required environment variables are configured (Clerk keys, etc.)

For detailed setup instructions, see [README.md](README.md) sections "Configurar Banco de Dados" and "Acesso Admin".

## Project Map (for orientation)
- App Router: src/app (public: `src/app/(public)`, protected: `src/app/(protected)`, APIs: `src/app/api/*`)
- Components: src/components
- Libraries & domain: src/lib
- Prisma schema: prisma
- Static assets: public

For setup, scripts, and workflows, follow [docs/README.md](docs/README.md).
