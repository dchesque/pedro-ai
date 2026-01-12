# AI Chat

## Overview

The AI Chat feature provides a protected, streaming chat interface powered by the Vercel AI SDK (`ai`). Users can interact with AI models via OpenRouter (OpenAI-compatible), select models dynamically, generate images, and attach files. It integrates with the app's credits system, authentication, and storage.

- **Route**: `/ai-chat` (protected, listed in sidebar via `navigationItems` in [src/components/app/sidebar.tsx](src/components/app/sidebar.tsx))
- **API Endpoints**:
  | Endpoint | Method | Purpose | Auth | Credits |
  |----------|--------|---------|------|---------|
  | `/api/ai/chat` | POST | Streaming text chat or image gen | Required | 1 (`ai_text_chat`) or 5 (`ai_image_generation`) |
  | `/api/ai/openrouter/models` | GET | Fetch OpenRouter models | Required | None |
  | `/api/ai/image` | POST | Standalone image generation | Required | 5 |
  | `/api/upload` | POST | File upload for attachments (Vercel Blob) | Required | None (see [docs/uploads.md](docs/uploads.md)) |

Key files:
- **Page**: [src/app/(protected)/ai-chat/page.tsx](src/app/(protected)/ai-chat/page.tsx) – Chat UI with `useChat` hook
- **Chat API**: [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts) – Streams responses via `toAIStreamResponse()`
- **Models API**: [src/app/api/ai/openrouter/models/route.ts](src/app/api/ai/openrouter/models/route.ts) – Dynamic model list
- **Image API**: [src/app/api/ai/image/route.ts](src/app/api/ai/image/route.ts) – Image gen via OpenRouter
- **Components**:
  - [src/components/ai-chat/ChatInput.tsx](src/components/ai-chat/ChatInput.tsx) – Composer with attachments & image toggle
  - Message bubbles: [src/components/chat/message-bubble.tsx](src/components/chat/message-bubble.tsx)

Cross-references:
- Credits: [src/lib/credits/*](src/lib/credits/) ([validateCreditsForFeature](src/lib/credits/validate-credits.ts), [deductCreditsForFeature](src/lib/credits/deduct.ts))
- Auth: [src/lib/auth-utils.ts](src/lib/auth-utils.ts), [src/lib/api-auth.ts](src/lib/api-auth.ts)
- Storage: [src/lib/storage/*](src/lib/storage/) (Vercel Blob via [src/lib/storage/vercel-blob.ts](src/lib/storage/vercel-blob.ts))
- Providers: OpenRouter via [src/lib/ai/providers/openrouter-adapter.ts](src/lib/ai/providers/openrouter-adapter.ts)

## Setup

### Environment Variables
Add to `.env.local`:
```
OPENROUTER_API_KEY=your_openrouter_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token  # For attachments
```

### Dependencies
```
npm install ai @ai-sdk/openai @ai-sdk/react zod
```

## Features

### 1. Text Chat
- **UI**: Dropdown for model selection (static + dynamic from OpenRouter).
- **API Flow** (`/api/ai/chat`):
  1. Authenticate user via Clerk ID.
  2. Validate credits (1 for text).
  3. Parse body: `{ provider: 'openrouter', model: 'vendor/model', messages: ChatMessage[], temperature?: number }`.
  4. Create OpenRouter client: `createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })`.
  5. Stream: `generateText({ model, messages }).toAIStreamResponse()`.

**Example Request** (via `useChat`):
```ts
const { messages, append, isLoading } = useChat({
  api: '/api/ai/chat',
  initialMessages: [{ role: 'user', content: 'Hello!' }],
});
```

### 2. Image Generation
- **Toggle**: "Modo: Imagem" in ChatInput switches to image mode.
- **API** (`/api/ai/image` or chat):
  - Body: `{ model: 'google/gemini-2.5-flash-image-preview', prompt: string, size?: string, count?: number }`
  - Deducts 5 credits.
  - Returns `{ images: string[] }` (base64 data URLs).
- **Inline Display**: Images render as `<img src={dataUrl} />` in message bubbles.

**Example**:
```ts
// In chat mode (image enabled)
{ role: 'assistant', content: JSON.stringify({ images: ['data:image/png;base64,...'] }) }
```

### 3. Model Management
- **Static Fallback**: `MODELS` map in page.tsx (e.g., `{ id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' }`).
- **Dynamic**: Fetch via `/api/ai/openrouter/models` → [useOpenRouterModels](src/hooks/use-openrouter-models.ts).
- **Validation** (Zod in API):
  ```ts
  provider: z.enum(['openrouter'])
  model: z.string().regex(/^[^/]+\/[^/]+$/)  // vendor/model
  ```

**Hook Usage**:
```tsx
const { data: models } = useOpenRouterModels();  // OpenRouterModelsResponse
```

### 4. Attachments
- **Upload**: Drag/drop or select → POST `/api/upload` → Vercel Blob URL.
- **Integration**: Appends "Attachments: [file1](url1)" to user message.
- **Model Context**: Links passed in prompt; models can reference them.

**Example Message Injection**:
```
User: Describe this image. Attachments: [photo.jpg](https://blob.vercel-storage.com/...)
```

### 5. Credits & Limits
- **Hooks**: [useCredits](src/hooks/use-credits.ts), [useUsage](src/hooks/use-usage.ts).
- **UI**: Displays balance & disables submit if insufficient.
- **Server**: `validateCreditsForFeature(clerkUserId, 'ai_text_chat')` before processing.

**Error Handling**:
- `InsufficientCreditsError` → User-friendly toast.

### 6. Security
- **Auth**: Enforced via [validateUserAuthentication](src/lib/auth-utils.ts).
- **Proxy**: No client-side API keys.
- **Zod**: Strict input validation.
- **Admin**: No special perms needed.

## Customization

### Add Provider
1. Update `PROVIDERS` constant in page.tsx.
2. Extend API validation.
3. Register adapter in [src/lib/ai/providers/registry.ts](src/lib/ai/providers/registry.ts).

### New Model
```ts
// In page.tsx MODELS
{ id: 'new/vendor/model', label: 'New Model' }
```

### Extend Chat (e.g., Tools)
Use `experimental_onToolCall` in `generateText` options.

## Troubleshooting
- **No Models**: Check `OPENROUTER_API_KEY` & network.
- **Credits Error**: Verify [src/lib/credits/settings.ts](src/lib/credits/settings.ts) → `AdminSettingsPayload`.
- **Blob Upload Fail**: See [docs/uploads.md](docs/uploads.md).
- **Streaming Issues**: Ensure Vercel AI SDK compat (v3+).

## Related Features
- **AI Studio**: [src/app/(protected)/ai-studio/page.tsx](src/app/(protected)/ai-studio/page.tsx) – Advanced workflows.
- **Styles**: [useStyles](src/hooks/use-styles.ts) for visual consistency.
- **Shorts Pipeline**: Integrates AI for script gen ([useGenerateScript](src/hooks/use-shorts.ts)).

For full codebase nav, see [Symbol Index](symbol-index.md).
