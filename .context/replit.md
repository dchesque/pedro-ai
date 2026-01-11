# Next.js SaaS Template

## Overview
This is a Next.js 15 SaaS starter kit with integrated payment processing (Asaas), authentication (Clerk), AI features (OpenRouter), and database management (Prisma/PostgreSQL).

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities and configurations
- `src/hooks/` - React hooks including credits management
- `prisma/` - Database schema and migrations
- `.context/docs/` - Documentation
- `scripts/` - Utility scripts

## Technology Stack
- **Framework**: Next.js 15.5.4 with React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Asaas
- **AI**: OpenRouter integration

## Workflows
- **Next.js App**: Runs the development server on port 5000
  - Command: `npm run dev -- -p 5000`

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (generates Prisma client + Next.js build)
- `npm run db:push` - Push schema changes to database (use this instead of migrations)
- `npm run db:migrate` - Run database migrations (local dev only)
- `npm run db:studio` - Open Prisma Studio

## Deployment Notes
- Build command does NOT run migrations (removed `prisma migrate deploy`)
- Database schema changes should be applied via `npm run db:push` before deploying
- This approach avoids migration conflicts with existing production data

## Configuration Required
This app uses a Replit PostgreSQL database (already set up). Additional environment variables needed:
- Clerk API keys (for authentication)
- Asaas API keys (for payments)
- OpenRouter API key (for AI features)

## Credit Management Architecture
**Clerk is authentication-only. All credit/plan data is stored in PostgreSQL.**

### Database Tables:
- **User** - `currentPlanId`, `billingPeriodEnd`, `cancellationScheduled`, `cancellationDate`
- **CreditBalance** - `creditsRemaining`, `clerkUserId`, `lastSyncedAt`
- **Plan** - defines available plans with credits and pricing

### Data Flow:
1. **Payment**: User pays via Asaas
2. **Webhook**: Asaas webhook (`/api/webhooks/asaas`) writes to `User` and `CreditBalance`
3. **API**: `/api/credits/me` reads from database
4. **Frontend**: `useCredits` hook fetches from API

### Key APIs:
- `/api/credits/me` - Returns credits, plan, billingPeriodEnd, cancellationScheduled
- `/api/subscription/status` - Returns current subscription status from database
- `/api/subscription/cancel` - Schedules cancellation (keeps access until period ends)
- `/api/checkout` - Creates Asaas subscription

### Webhook Responsibilities:
- **Clerk webhook**: Only creates User record on signup (no credit/plan sync)
- **Asaas webhook**: Handles all payment events, updates credits and plan in database

## Recent Changes
- 2025-12-08: Complete database-centric architecture
  - Removed ALL Clerk metadata dependencies for credits/plans
  - Added `billingPeriodEnd`, `cancellationScheduled`, `cancellationDate` to User model
  - Refactored all APIs to read exclusively from database
  - Simplified Clerk webhook (authentication only)
  - Updated Asaas webhook to save billing period data
  - Refactored `use-credits` hook to use API data only
  - Cleaned up `subscription-utils.ts` (removed legacy Clerk helpers)

- 2025-12-08: Subscription cancellation feature
  - Added cancel subscription API endpoint (`/api/subscription/cancel`)
  - Added cancel button with confirmation dialog in billing page
  - Implemented scheduled downgrade logic (keeps access until billing period ends)
  - Users can cancel and keep credits until the end of their paid period
  - Automatic reset to free plan when billing period expires

- 2025-12-05: Initial Replit setup
  - Installed Node.js 22
  - Configured Next.js for Replit (allowedDevOrigins)
  - Set up PostgreSQL database and pushed schema
  - Created workflow for development server on port 5000
