# AI Chat – Vercel AI SDK

This template includes a minimal AI chat that streams responses and lets users pick the OpenRouter model.

## Overview
- API: `POST /api/ai/chat` – uses Vercel AI SDK (`ai`) with the OpenRouter client. Requires auth, validates inputs with Zod, and allowlists models.
- Provider: OpenRouter (OpenAI-compatible via `baseURL`).
- Page: `/ai-chat` (protected) – dropdowns for provider/model plus a streaming chat UI.

## Environment Variables
Add the API key to `.env.local`:

```
OPENROUTER_API_KEY=
```

## Files
- API route: `src/app/api/ai/chat/route.ts`
  - Selects provider and model from body: `{ provider, model, messages, temperature }`
  - Returns `result.toAIStreamResponse()` for SSE streaming
- UI page: `src/app/(protected)/ai-chat/page.tsx`
  - Uses `useChat` from `@ai-sdk/react`
  - Provider/models dropdowns in `PROVIDERS` (currently only OpenRouter) and `MODELS` constants

## Model Management
- Static models: append to the `MODELS` map in the chat page with `{ id, label }` entries.
- Dynamic models: `/api/ai/openrouter/models` fetches available models from OpenRouter and hydrates the dropdown.
- Validation: the API restricts provider to `openrouter` and checks model IDs against the expected `vendor/model` pattern.

## OpenRouter Notes
- OpenRouter is OpenAI-compatible; use `createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY })`.
- Model IDs include vendor prefix (e.g., `anthropic/claude-3.5-sonnet`).

## Security & Limits
- Never expose provider API keys client-side; all calls proxy through the API route.
- Auth is enforced on both `/api/ai/chat` and `/api/ai/openrouter/models`.
- Inputs are validated with Zod; `provider` is allowlisted to `openrouter` and `model` is checked against the OpenRouter pattern.
- Rate-limit or require credits for usage in production.

## Credits
- This template charges credits per AI request by default:
  - Text chat: 1 credit per request (`feature: ai_text_chat`).
  - Image generation: 5 credits per request (`feature: ai_image_generation`).
- Implementation lives in `src/lib/credits/*` with helpers:
  - `validateCreditsForFeature(clerkUserId, feature[, quantity])`
  - `deductCreditsForFeature({ clerkUserId, feature, quantity, details })`
- API integration:
  - `POST /api/ai/chat` validates and deducts 1 credit before streaming.
  - `POST /api/ai/image` validates and deducts 5 credits before provider call; can charge per-image via body `count`.

### UI behavior
- The chat page shows the user’s remaining credits and the cost per action.
- The submit button is disabled when the user lacks sufficient credits for the selected mode.

## Image Generation (OpenRouter)
- API: `POST /api/ai/image` — requires auth, Zod-validates `{ model, prompt, size?, count? }` and uses OpenRouter’s OpenAI-compatible chat/completions with image modality.
- Default model: `google/gemini-2.5-flash-image-preview` (override by passing another OpenRouter image-capable model ID like `vendor/model`).
- Response: `{ images: string[] }` — data URLs (`data:image/png;base64,...`).
- UI: The chat page has a “Modo: Imagem” toggle; when enabled, submit triggers image generation and displays results inline.

## Attachments (Vercel Blob)
- Users can attach a file in the chat composer. Files upload to Vercel Blob via `POST /api/upload` and appear as clickable chips.
- On send, the chat injects an "Attachments:" section with links into the message content so both the model and history can reference them.
- Setup:
  - Add `BLOB_READ_WRITE_TOKEN` to `.env.local`.
  - See docs/uploads.md for details and sample requests.

## Navigation
- Sidebar entry added: “AI Chat” → `/ai-chat` via `navigationItems` in `src/components/app/sidebar.tsx`.
