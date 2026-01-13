# AI Chat

## Overview

The AI Chat feature provides a protected, streaming chat interface powered by the Vercel AI SDK (`ai`). Users interact with AI models via OpenRouter (OpenAI-compatible), dynamically select models, generate images, and attach files. It integrates with the app's credits system, Clerk authentication, Vercel Blob storage, and usage tracking.

- **Route**: `/ai-chat` (protected route under `(protected)` layout, accessible via sidebar navigation in [src/components/app/sidebar.tsx](src/components/app/sidebar.tsx)).
- **Key Capabilities**:
  - Real-time streaming text responses.
  - Image generation (e.g., via `google/gemini-2.5-flash-image-preview`).
  - File attachments for multimodal prompts.
  - Model selection from static list + dynamic OpenRouter fetch.
  - Credit deduction and balance display.

### API Endpoints

| Endpoint                  | Method | Purpose                          | Auth Required | Credits Cost                  |
|---------------------------|--------|----------------------------------|---------------|-------------------------------|
| `/api/ai/chat`            | POST   | Streaming chat (text/image)      | Yes           | 1 (`ai_text_chat`) / 5 (`ai_image_generation`) |
| `/api/ai/openrouter/models` | GET  | List available OpenRouter models | Yes           | None                          |
| `/api/ai/image`           | POST   | Standalone image generation      | Yes           | 5 (`ai_image_generation`)     |
| `/api/upload`             | POST   | File upload to Vercel Blob       | Yes           | None ([see uploads docs](docs/uploads.md)) |

**Core Files**:
- **Page**: [src/app/(protected)/ai-chat/page.tsx](src/app/(protected)/ai-chat/page.tsx) – Main UI with `useChat` from `@ai-sdk/react`.
- **Chat Handler**: [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts) – Validates inputs, deducts credits, streams via `generateText().toAIStreamResponse()`.
- **Models Handler**: [src/app/api/ai/openrouter/models/route.ts](src/app/api/ai/openrouter/models/route.ts) – Proxies OpenRouter models list.
- **Image Handler**: [src/app/api/ai/image/route.ts](src/app/api/ai/image/route.ts) – Dedicated image gen endpoint.
- **Components**:
  - [src/components/ai-chat/ChatInput.tsx](src/components/ai-chat/ChatInput.tsx) – Input composer with model selector, image toggle, file uploads.
  - [src/components/chat/message-bubble.tsx](src/components/chat/message-bubble.tsx) – Renders text, images (base64), and attachments.

**Cross-References**:
- **Credits**: [src/lib/credits/validate-credits.ts](src/lib/credits/validate-credits.ts) (`validateCreditsForFeature`), [src/lib/credits/deduct.ts](src/lib/credits/deduct.ts) (`deductCreditsForFeature`).
- **Auth**: [src/lib/auth-utils.ts](src/lib/auth-utils.ts) (`validateUserAuthentication`), [src/lib/api-auth.ts](src/lib/api-auth.ts).
- **AI Providers**: [src/lib/ai/providers/openrouter-adapter.ts](src/lib/ai/providers/openrouter-adapter.ts), [src/lib/ai/providers/registry.ts](src/lib/ai/providers/registry.ts).
- **Storage**: [src/lib/storage/vercel-blob.ts](src/lib/storage/vercel-blob.ts), [src/hooks/use-storage.ts](src/hooks/use-storage.ts).
- **Hooks**: [src/hooks/use-openrouter-models.ts](src/hooks/use-openrouter-models.ts), [src/hooks/use-credits.ts](src/hooks/use-credits.ts), [src/hooks/use-usage.ts](src/hooks/use-usage.ts).

## Setup

### Environment Variables
```env
OPENROUTER_API_KEY=sk-or-v1-...  # Required for OpenRouter proxy
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...  # For file attachments
```

### Install Dependencies
```bash
npm install ai @ai-sdk/openai @ai-sdk/openrouter @ai-sdk/react zod
# Optional for React hooks: lucide-react (icons), dropzone (file upload)
```

### Admin Configuration
Update credits in Admin Panel → Settings → Features:
- `ai_text_chat`: 1 credit.
- `ai_image_generation`: 5 credits.

See [src/lib/credits/settings.ts](src/lib/credits/settings.ts) (`AdminSettingsPayload`).

## Usage

### 1. Text Chat
Uses `useChat` hook for state management and streaming.

**Client Example** (`page.tsx`):
```tsx
import { useChat } from 'ai/react';
import { useOpenRouterModels } from '@/hooks/use-openrouter-models';

export default function AIChatPage() {
  const { data: models } = useOpenRouterModels();
  const { messages, append, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    initialMessages: [
      { id: 'welcome', role: 'assistant', content: 'Olá! Como posso ajudar?' }
    ],
    body: { provider: 'openrouter' }  // Fixed provider
  });

  return (
    <div className="ai-chat-container">
      {/* Model selector, messages list */}
      <ChatInput
        models={models}
        onModelChange={(model) => {/* Update body.model via experimental_set* hooks */}}
        {...{ input, handleInputChange, handleSubmit, isLoading }}
      />
    </div>
  );
}
```

**Server Flow** (`/api/ai/chat/route.ts`):
1. Extract `clerkUserId` from headers.
2. Zod validation: `messages`, `model` (regex `^[^/]+\/[^/]+$`), `temperature`.
3. `validateCreditsForFeature(clerkUserId, isImageMode ? 'ai_image_generation' : 'ai_text_chat')`.
4. Create OpenRouter client: `createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })`.
5. `generateText({ model, messages, temperature }).toAIStreamResponse()`.

### 2. Image Generation
- Toggle "Modo: Imagem" in `ChatInput.tsx`.
- Prompts send to `/api/ai/chat` or `/api/ai/image`.
- Response: `{ images: string[] }` (base64 PNG data URLs).
- Rendered inline in [message-bubble.tsx](src/components/chat/message-bubble.tsx).

**Standalone Image Example**:
```ts
// POST /api/ai/image
{
  "model": "google/gemini-2.5-flash-image-preview",
  "prompt": "A futuristic cityscape",
  "size": "1024x1024",
  "count": 1
}
```

**Chat Integration**:
```json
{
  "role": "assistant",
  "content": "{\"images\":[\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...\"]}",
  "experimental_imageUrls": [{ url: "data:...", mimeType: "image/png" }]
}
```

### 3. Model Management
- **Static List**: Hardcoded `MODELS` in `page.tsx` (e.g., `anthropic/claude-3.5-sonnet`).
- **Dynamic**: 
  ```tsx
  const { data: { models } }: { data: OpenRouterModelsResponse } = useOpenRouterModels();
  // { models: OpenRouterModel[] } – e.g., { id: 'model/id', name: 'Model Name' }
  ```

**Validation** (Zod schema in APIs):
```ts
const schema = z.object({
  provider: z.enum(['openrouter']),
  model: z.string().regex(/^[^/]+\/[^/]+$/),  // e.g., 'openai/gpt-4o'
});
```

### 4. File Attachments
- Drag/drop or click upload in `ChatInput.tsx`.
- POST to `/api/upload` → Returns Vercel Blob URL.
- Auto-appends to prompt: `Attachments: [file.jpg](https://blob.vercel-storage.com/...)\n\nYour query...`

**Multimodal Support**: Models like Gemini process image URLs in context.

### 5. Credits & Usage Tracking
- **Client Hooks**:
  ```tsx
  const { data: credits } = useCredits();  // CreditsResponse
  const { data: usage } = useUsage();  // UsageData
  ```
- **UI**: Balance chip, submit disabled if `credits.balance < cost`.
- **Server**: Throws `InsufficientCreditsError` → Toast on client.

### 6. Error Handling
- `ApiError`, `InsufficientCreditsError` → User-friendly messages.
- Network/Rate-limit: Retry logic in `useChat`.
- Logs: [src/lib/logger.ts](src/lib/logger.ts) (`createLogger`).

## Customization

### Add New Provider
1. Create adapter: Extend [OpenRouterAdapter](src/lib/ai/providers/openrouter-adapter.ts).
2. Register in [registry.ts](src/lib/ai/providers/registry.ts): `PROVIDERS.set('newprov', createNewProvider())`.
3. Update Zod: `z.enum(['openrouter', 'newprov'])`.

### Extend with Tools/Functions
```ts
// In API handler
generateText({
  model,
  messages,
  tools: { /* OpenAI tools schema */ },
  experimental_onToolCall: async (call) => { /* Handle */ }
});
```

### Custom Models
Add to static `MODELS`:
```ts
{ id: 'new/provider/model', label: 'Custom Model', imageGen: true }
```

## Troubleshooting

| Issue                          | Cause/Fix |
|--------------------------------|-----------|
| No models load                 | Verify `OPENROUTER_API_KEY`; check `/api/ai/openrouter/models` response. |
| Credits not deducting          | Admin settings → Ensure feature keys match (`ai_text_chat`). |
| Upload fails                   | `BLOB_READ_WRITE_TOKEN`; Vercel Blob limits ([docs/uploads.md](docs/uploads.md)). |
| Streaming stops                | AI SDK v3+; OpenRouter rate limits (upgrade plan). |
| Image not rendering            | Base64 prefix `data:image/png;base64,`; Check MIME in `message-bubble.tsx`. |
| Auth errors                    | Clerk webhook sync; [validateUserAuthentication](src/lib/auth-utils.ts). |

**Debug**: Enable dev logging via `AdminDevModeProvider` ([src/contexts/admin-dev-mode.tsx](src/contexts/admin-dev-mode.tsx)).

## Related Features
- **AI Studio**: Advanced agent workflows ([src/app/(protected)/ai-studio/page.tsx](src/app/(protected)/ai-studio/page.tsx), [useAgents](src/hooks/use-agents.ts)).
- **Shorts Generation**: AI script gen ([useGenerateScript](src/hooks/use-shorts.ts), [src/lib/agents/scriptwriter.ts](src/lib/agents/scriptwriter.ts)).
- **Usage Dashboard**: [useUsageHistory](src/hooks/use-usage-history.ts).
- **Full Symbol Index**: See [symbol-index.md](symbol-index.md) for `AIModel`, `OpenRouterModelsResponse`, etc.

Last updated: Analyzed from 406 files, 911 symbols (focus: AI Chat routes/components/hooks).
