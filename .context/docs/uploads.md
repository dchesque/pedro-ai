# File Uploads (Storage Providers)

This project supports user file attachments in the AI Chat using multiple storage providers: **Vercel Blob** or **Replit App Storage**.

## Storage Provider Selection

The system automatically selects the storage provider based on environment variables:

1. **Explicit selection**: Set `STORAGE_PROVIDER=vercel_blob` or `STORAGE_PROVIDER=replit`
2. **Auto-detection**: If `STORAGE_PROVIDER` is not set, the system checks:
   - If `REPLIT_STORAGE_BUCKET_ID` is configured → uses Replit App Storage
   - If `BLOB_READ_WRITE_TOKEN` is configured → uses Vercel Blob
   - Throws an error if neither is configured

## Vercel Blob

### Prerequisites
- Set `BLOB_READ_WRITE_TOKEN` in `.env.local`. Generate a token in Vercel → Storage → Blob → Tokens.
- The token is scoped to a specific Blob Store and Region — you do not need to pass the Store ID or Region in code; the token carries that scope.

### Optional: Store Settings
- Unique Store ID: visible in Vercel → Storage → Blob → your store. Useful for identification and token scoping, but not required in this code path.
- Storage Region: chosen when creating the store. The upload API uses the region bound to your token automatically.
- Base URL: default public base is `https://blob.vercel-storage.com`. If you set up a custom domain, downloads will be served from there and the API response `url` will reflect it. No extra config is needed in this repo.
- Deploy environment variables to Vercel as well if needed.

## Replit App Storage

### Prerequisites
- Set `REPLIT_STORAGE_BUCKET_ID` in `.env.local`. Get the Bucket ID from Replit → App Storage → Settings.
- This project usa o SDK oficial `@replit/object-storage` e segue a documentação: https://docs.replit.com/reference/object-storage-javascript-sdk

### Opções adicionais
- (Opcional) Defina `REPLIT_STORAGE_PUBLIC_BASE_URL` se você tiver um domínio/CDN customizado para o bucket.
- Quando o app roda no Replit, a autenticação é automática. Fora do Replit, configure suas credenciais seguindo a documentação oficial antes de usar o SDK.

### Getting Started
1. Crie um bucket em Replit → App Storage
2. Copie o Bucket ID na aba Settings
3. Defina `REPLIT_STORAGE_BUCKET_ID=<seu-bucket-id>` no `.env.local`
4. (Opcional) Defina `STORAGE_PROVIDER=replit` para selecionar explicitamente o provedor

## API
- `POST /api/upload` (authenticated)
  - Accepts `multipart/form-data` with a single `file` field.
  - Stores the file at `uploads/<clerkUserId>/<timestamp>-<sanitized-filename>` in the configured storage provider.
  - Returns:
    ```json
    {
      "url": "https://...",
      "pathname": "uploads/usr_123/1715712345-file.pdf",
      "contentType": "application/pdf",
      "size": 12345,
      "name": "file.pdf"
    }
    ```
  - Limits: default 25MB per file. Make it configurable with `BLOB_MAX_SIZE_MB`.
  - Admin tracking: each upload is persisted to `StorageObject` with the uploader (DB `userId` + `clerkUserId`) and provider name.

### Admin Management
- List and manage uploads at `/admin/storage` (admin-only).
- API:
  - `GET /api/admin/storage?q=&limit=&cursor=` — paginated list with user info
  - `DELETE /api/admin/storage/:id` — deletes from storage provider (best-effort) and soft-deletes the record
- Model: `StorageObject` (url, pathname, name, contentType, size, createdAt, user relation, provider, optional `deletedAt`).

Example (curl):
```bash
curl -X POST \
  -H "Authorization: Bearer <session-cookie/headers via browser>" \
  -F file=@./example.pdf \
  http://localhost:3000/api/upload
```
(Note: Auth is handled by Clerk in-browser; use the App UI to upload locally.)

## Client (AI Chat)
- The paperclip button opens a file picker.
- Files are uploaded to `/api/upload` and shown as chips.
- On send, the chat appends a Markdown section with links:
  ```
  Attachments:
  - filename.ext: https://...
  ```
- Messages then include attachment links in history and for the model to consider.

## Access & Security
- Current implementation uses `access: 'public'` for convenience.
- For private files, switch to private storage and generate signed URLs on demand.
- Consider MIME allowlists, virus scanning, and retention policies for production.
- If switching to private storage, update the admin UI to generate signed URLs for preview.

## Files
- Storage interface: `src/lib/storage/`
- API: `src/app/api/upload/route.ts`
- Admin list/delete: `src/app/api/admin/storage/*` and `src/app/admin/storage/page.tsx`
- UI: `src/app/(protected)/ai-chat/page.tsx` (composer uploads and chips)
