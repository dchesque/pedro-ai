# File Uploads (Storage Providers)

This documentation covers the file upload system for user attachments, primarily used in the AI Chat feature. It supports pluggable storage providers (**Vercel Blob** or **Replit App Storage**) via a unified `StorageProvider` interface. Uploads are authenticated, tracked in the database (`StorageObject` model), and integrated into chat messages as Markdown links.

## Key Features

- **Multi-provider support**: Auto-detect or explicitly configure Vercel Blob or Replit.
- **API endpoint**: `POST /api/upload` for client uploads.
- **Admin management**: List/delete at `/admin/storage`.
- **Client integration**: File picker → upload → chip display → Markdown in messages.
- **Limits**: 25MB default (configurable via `BLOB_MAX_SIZE_MB`).
- **Security**: Public access for simplicity; extensible to private/signed URLs.
- **Database tracking**: Every upload creates a `StorageObject` record with user, size, provider, etc.
- **Credit tracking**: Uploads deduct credits via `OperationType.StorageUpload` (see [`useCredits`](src/hooks/use-credits.ts)).

## Storage Provider Selection

The provider is selected dynamically in [`src/lib/storage/index.ts`](src/lib/storage/index.ts):

```ts
// Provider factory logic (excerpt)
if (STORAGE_PROVIDER === 'vercel_blob') return new VercelBlobStorage();
if (STORAGE_PROVIDER === 'replit') return new ReplitAppStorage();
if (REPLIT_STORAGE_BUCKET_ID) return new ReplitAppStorage();
if (BLOB_READ_WRITE_TOKEN) return new VercelBlobStorage();
throw new Error('No storage provider configured');
```

| Env Var | Priority | Effect | Required For |
|---------|----------|--------|--------------|
| `STORAGE_PROVIDER=vercel_blob \| replit` | Highest | Explicit selection | Overrides auto-detect |
| `REPLIT_STORAGE_BUCKET_ID` | Medium | Auto-select Replit | Replit bucket ID |
| `BLOB_READ_WRITE_TOKEN` | Medium | Auto-select Vercel Blob | Vercel RW token |
| `BLOB_MAX_SIZE_MB` | Low | File size limit (default: 25) | Both |
| `REPLIT_STORAGE_PUBLIC_BASE_URL` | Low | Custom CDN URL for Replit | Replit (optional) |

**Tip**: Set `STORAGE_PROVIDER` in production `.env` for consistency.

## Providers

### Vercel Blob (`VercelBlobStorage`)

**Location**: [`src/lib/storage/vercel-blob.ts`](src/lib/storage/vercel-blob.ts)  
**Exports**: `VercelBlobStorage` (class implementing `StorageProvider`)

#### Setup
1. [Create Blob store](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk) in Vercel Dashboard → Storage → Blob.
2. Generate `BLOB_READ_WRITE_TOKEN` (store/region-scoped).
3. Add to `.env`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   BLOB_MAX_SIZE_MB=25  # Optional
   ```
4. Deploy; token auto-picked up.

#### Features
- Public URLs (`access: 'public'`).
- Handles custom domains/regions.
- Integrates with Vercel Edge Runtime.

**Core Implementation**:
```ts
export class VercelBlobStorage implements StorageProvider {
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const pathname = `${options?.pathname || 'uploads'}/${file.name}`;
    const { pathname: resolvedPath } = await put(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/handler',  // Vercel-specific
    });
    // Fetch size/contentType via head() and return UploadResult
  }

  async delete(pathname: string): Promise<void> {
    await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
  }
}
```

### Replit App Storage (`ReplitAppStorage`)

**Location**: [`src/lib/storage/replit.ts`](src/lib/storage/replit.ts)  
**Exports**: `ReplitAppStorage` (class implementing `StorageProvider`)

#### Setup
1. [Create bucket](https://docs.replit.com/reference/object-storage-javascript-sdk) in Replit → App Storage.
2. Copy `Bucket ID`.
3. Add to `.env`:
   ```
   REPLIT_STORAGE_BUCKET_ID=r2_...
   REPLIT_STORAGE_PUBLIC_BASE_URL=https://cdn.example.com  # Optional
   ```
4. `npm i @replit/object-storage`.

#### Features
- Auto-auth in Replit deployments.
- Public bucket assumed (`/public/<key>`).

**Core Implementation**:
```ts
export class ReplitAppStorage implements StorageProvider {
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const bucket = getBucket(REPLIT_STORAGE_BUCKET_ID!);
    const pathname = `${options?.pathname || 'uploads'}/${file.name}`;
    await bucket.put(pathname, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    const publicUrl = `${REPLIT_STORAGE_PUBLIC_BASE_URL || bucket.url}/public/${pathname}`;
    // Compute size and return UploadResult
  }

  async delete(pathname: string): Promise<void> {
    const bucket = getBucket(REPLIT_STORAGE_BUCKET_ID!);
    await bucket.delete(pathname);
  }
}
```

## Interfaces & Types

**Location**: [`src/lib/storage/types.ts`](src/lib/storage/types.ts)

```ts
export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  name: string;
}

export interface UploadOptions {
  pathname?: string;
}

export interface StorageProvider {
  upload(file: File, options?: UploadOptions): Promise<UploadResult>;
  delete(pathname: string): Promise<void>;
}

export type StorageProviderType = 'vercel_blob' | 'replit';
```

**StorageItem** (for hooks): Simplified `StorageObject` projection.

## API Endpoints

### Upload (`POST /api/upload`)

**Location**: [`src/app/api/upload/route.ts`](src/app/api/upload/route.ts)  
**Auth**: Clerk session (via `auth()`).  
**Body**: `multipart/form-data` (`file` field).  
**Pathname**: `uploads/<clerkUserId>/<timestamp>-<sanitized-filename>`.  
**Limits**: Enforced by `BLOB_MAX_SIZE_MB`; virus/MIME checks recommended.

**Response** (`200 OK`):
```json
{
  "url": "https://blob.vercel-storage.com/uploads/usr_2abc/1715712345-doc.pdf",
  "pathname": "uploads/usr_2abc/1715712345-doc.pdf",
  "contentType": "application/pdf",
  "size": 123456,
  "name": "doc.pdf"
}
```

**Error** (`400/401/413`): `ApiError` format.

**cURL** (auth via cookies/session):
```bash
curl -X POST -F "file=@doc.pdf" http://localhost:3000/api/upload
```

**Creates**: `StorageObject` record + deducts credits.

### Admin Storage (`/api/admin/storage`)

**Location**: [`src/app/api/admin/storage/[...path]/route.ts`](src/app/api/admin/storage/[...path]/route.ts)  
**Auth**: Admin required (`requireAdmin()`).

- **GET** `/?q=<search>&limit=20&cursor=`: Paginated list (`StorageResponse`).
- **DELETE /:id**: Soft-delete DB + provider delete.

**UI**: [`src/app/admin/storage/page.tsx`](src/app/admin/storage/page.tsx) – Data table with search/delete.

## Database Model

**Prisma Schema** (`StorageObject`):
```prisma
model StorageObject {
  id          String   @id @default(cuid())
  url         String
  pathname    String   @unique
  name        String
  contentType String?
  size        Int
  provider    StorageProviderType
  userId      String
  clerkUserId String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  deletedAt   DateTime?

  @@map("storage_objects")
}
```

**Queries**: Via `useStorage` hook (Prisma `findMany` with pagination/filter).

## Client Hooks

**Location**: [`src/hooks/use-storage.ts`](src/hooks/use-storage.ts)

```ts
// List uploads
const { data } = useStorage({ userId?: string; limit?: number; q?: string });
type StorageResponse = { items: StorageItem[]; nextCursor?: string };

// Delete
const deleteItem = useDeleteStorageItem();
await deleteItem(id);
```

**Related**: [`useCredits`](src/hooks/use-credits.ts) for upload costs.

**Example** (AI Chat integration):
```tsx
// src/components/chat/AttachmentUploader.tsx (pattern)
import { apiClient } from '@/lib/api-client';
import { useStorage } from '@/hooks/use-storage';

const handleFileSelect = async (files: FileList) => {
  Array.from(files).forEach(async (file) => {
    if (file.size > MAX_SIZE) return toast.error('File too large');
    const { data } = await apiClient.POST<UploadResult>('/api/upload', { file });
    setAttachments(prev => [...prev, data]);  // Render as chips
    // Append to message: `[${data.name}](${data.url})`
  });
};
```

## Usage Examples

### 1. AI Chat Attachments
- File input → `/api/upload` → `AttachmentChip` → Markdown in `ChatMessage`.
- See: [`src/app/(protected)/ai-chat/page.tsx`](src/app/(protected)/ai-chat/page.tsx), [`src/components/chat/message-bubble.tsx`](src/components/chat/message-bubble.tsx).

### 2. Custom Component
```tsx
function FileManager() {
  const { data: items } = useStorage({ limit: 20 });
  const [deleteItem] = useDeleteStorageItem();

  return (
    <div>
      <input type="file" multiple onChange={uploadFiles} />
      <ul>
        {items?.items.map(item => (
          <li key={item.id}>
            <a href={item.url}>{item.name}</a> ({item.size}B)
            <button onClick={() => deleteItem(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Security & Best Practices

- **MIME Whitelist**: Extend `/api/upload`:
  ```ts
  const allowedTypes = ['image/*', 'application/pdf'];
  if (!allowedTypes.some(t => file.type.includes(t))) throw new Error('Invalid type');
  ```
- **Private Uploads**: Implement signed URLs:
  ```ts
  // Vercel example
  const { url } = await getSignedUrl({ token, pathname, expiresIn: 3600 });
  ```
- **Quota**: Enforce via `canCreate` checks + credits.
- **Cleanup**: Cron for `deletedAt` purges.
- **Monitoring**: Log via `createLogger`, track costs.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "No storage provider" | Missing env | Set `STORAGE_PROVIDER` or tokens |
| 413 Payload Too Large | File > limit | Increase `BLOB_MAX_SIZE_MB` |
| CORS errors | Custom domain | Configure provider CORS |
| Delete fails | Provider mismatch | Verify `provider` field |
| Replit auth fail | Non-Replit env | Use manual creds or Vercel |

**Logs**: Enable `isApiLoggingEnabled()` for upload traces.

## Related Files & Cross-References

| Category | Files |
|----------|-------|
| **Core Storage** | [`index.ts`](src/lib/storage/index.ts), [`types.ts`](src/lib/storage/types.ts), [`vercel-blob.ts`](src/lib/storage/vercel-blob.ts), [`replit.ts`](src/lib/storage/replit.ts) |
| **API Routes** | [`/api/upload`](src/app/api/upload/route.ts), [`/api/admin/storage`](src/app/api/admin/storage/[...path]/route.ts) |
| **Hooks** | [`use-storage.ts`](src/hooks/use-storage.ts), [`use-credits.ts`](src/hooks/use-credits.ts) |
| **UI/Admin** | [`ai-chat/page.tsx`](src/app/(protected)/ai-chat/page.tsx), [`admin/storage/page.tsx`](src/app/admin/storage/page.tsx) |
| **Utils** | [`api-client.ts`](src/lib/api-client.ts), [`auth-utils.ts`](src/lib/auth-utils.ts) |
| **Models** | Prisma `StorageObject` (see schema) |

**Extending**: Add provider → Implement `StorageProvider` → Register in `index.ts`.

See [Vercel Blob](https://vercel.com/docs/storage/vercel-blob/sdk), [Replit Storage](https://docs.replit.com/reference/object-storage-javascript-sdk).
