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

## Storage Provider Selection

The provider is selected dynamically:

```ts
// src/lib/storage/index.ts (inferred logic)
if (STORAGE_PROVIDER === 'vercel_blob') return new VercelBlobStorage();
if (STORAGE_PROVIDER === 'replit') return new ReplitAppStorage();
if (REPLIT_STORAGE_BUCKET_ID) return new ReplitAppStorage();
if (BLOB_READ_WRITE_TOKEN) return new VercelBlobStorage();
throw new Error('No storage provider configured');
```

| Env Var | Priority | Effect |
|---------|----------|--------|
| `STORAGE_PROVIDER=vercel_blob \| replit` | Highest | Explicit selection |
| `REPLIT_STORAGE_BUCKET_ID` | Medium | Auto-select Replit |
| `BLOB_READ_WRITE_TOKEN` | Medium | Auto-select Vercel Blob |
| None | - | Error |

## Providers

### Vercel Blob (`VercelBlobStorage`)
**Class**: `src/lib/storage/vercel-blob.ts`

#### Setup
1. Create a Blob store in [Vercel Dashboard → Storage → Blob](https://vercel.com/docs/storage/vercel-blob).
2. Generate a `BLOB_READ_WRITE_TOKEN` (scoped to store/region).
3. Add to `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```
4. Optional: `BLOB_MAX_SIZE_MB=25` (default).

#### Features
- Public URLs by default (`access: 'public'`).
- Automatic region/store from token.
- Custom domains supported (URLs auto-adjust).

**Example Implementation** (excerpt):
```ts
// src/lib/storage/vercel-blob.ts
export class VercelBlobStorage implements StorageProvider {
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const { pathname } = await put(`${options?.pathname || 'uploads'}/${file.name}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/handler',
    });
    // Fetch metadata and return
  }
}
```

### Replit App Storage (`ReplitAppStorage`)
**Class**: `src/lib/storage/replit.ts`

#### Setup
1. Create a bucket in [Replit → App Storage](https://docs.replit.com/reference/object-storage-javascript-sdk).
2. Copy `Bucket ID` from Settings.
3. Add to `.env.local`:
   ```
   REPLIT_STORAGE_BUCKET_ID=r2_...
   ```
4. Optional: `REPLIT_STORAGE_PUBLIC_BASE_URL` for CDN/domain.
5. Install: `npm i @replit/object-storage`.

#### Features
- Auto-auth in Replit; manual creds elsewhere.
- Public bucket assumed.

**Example Implementation** (excerpt):
```ts
// src/lib/storage/replit.ts
export class ReplitAppStorage implements StorageProvider {
  async upload(file: File, options?: UploadOptions): Promise<UploadResult> {
    const bucket = getBucket(REPLIT_STORAGE_BUCKET_ID!);
    const key = `${options?.pathname || 'uploads'}/${file.name}`;
    await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    const url = `${REPLIT_STORAGE_PUBLIC_BASE_URL || 'https://' + bucket.url}/public/${key}`;
    // Return metadata
  }
}
```

## API Endpoints

### Upload (`POST /api/upload`)
- **Auth**: Clerk session required.
- **Body**: `multipart/form-data` with `file` field.
- **Path**: `uploads/<clerkUserId>/<timestamp>-<sanitized-filename>`.
- **Response**:
  ```ts
  // UploadResult (src/lib/storage/types.ts)
  interface UploadResult {
    url: string;
    pathname: string;
    contentType: string;
    size: number;
    name: string;
  }
  ```
  ```json
  {
    "url": "https://blob.vercel-storage.com/uploads/usr_2abc123/1715712345-file.pdf",
    "pathname": "uploads/usr_2abc123/1715712345-file.pdf",
    "contentType": "application/pdf",
    "size": 12345,
    "name": "file.pdf"
  }
  ```

**cURL Example** (use browser/App for auth):
```bash
curl -X POST \
  -H "Authorization: Bearer <clerk-session>" \
  -F "file=@example.pdf" \
  http://localhost:3000/api/upload
```

**Source**: `src/app/api/upload/route.ts`

### Admin Storage Management
- **List**: `GET /api/admin/storage?q=&limit=20&cursor=`
  - Query `q` filters by user/email/path.
  - Paginated with `StorageObject` records.
- **Delete**: `DELETE /api/admin/storage/:id`
  - Soft-delete DB + best-effort provider delete.

**Source**: `src/app/api/admin/storage/[...path]/route.ts`

**UI**: `/admin/storage` (`src/app/admin/storage/page.tsx`) – Data table with delete actions.

## Database Model
**`StorageObject`** (Prisma):
```prisma
model StorageObject {
  id          String   @id @default(cuid())
  url         String
  pathname    String   @unique
  name        String
  contentType String?
  size        Int
  provider    String   // 'vercel_blob' | 'replit'
  userId      String
  clerkUserId String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
}
```

Persisted on every upload for auditing/limits.

## Client Hooks
- **`useStorage()`**: List user uploads.
  ```ts
  // src/hooks/use-storage.ts
  const { data: uploads } = useStorage({ userId, limit: 10 });
  // Returns StorageResponse { items: StorageItem[], nextCursor? }
  ```
- **`useDeleteStorageItem(id)`**: Delete single item.

**Usage Example** (AI Chat):
```tsx
// src/app/(protected)/ai-chat/page.tsx (excerpt)
const handleUpload = async (file: File) => {
  const result = await apiClient.POST<UploadResult>('/api/upload', { file });
  setAttachments(prev => [...prev, result]);
};

// Displays chips; appends to message:
Attachments:
- ${name}: ${url}
```

## Integration Examples

### AI Chat Composer
1. Paperclip icon → `<input type="file" multiple />`.
2. Upload via `/api/upload`.
3. Render chips (`src/components/chat/attachment-chip.tsx`? inferred).
4. Send: Append Markdown links to prompt.

### Custom Upload
```tsx
import { useStorage, useDeleteStorageItem } from '@/hooks/use-storage';
import apiClient from '@/lib/api-client';

function MyUploader() {
  const uploadFile = async (file: File) => {
    const { data } = await apiClient.POST('/api/upload', { file });
    console.log('Uploaded:', data.url);
  };

  const { data: myUploads } = useStorage({ limit: 5 });
  const deleteItem = useDeleteStorageItem();

  return (
    <div>
      <input type="file" onChange={(e) => uploadFile(e.target.files[0])} />
      {myUploads?.items.map(item => (
        <div key={item.id}>
          {item.name} <button onClick={() => deleteItem(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Security & Production Tips
- **MIME Validation**: Add allowlist in `/api/upload` (e.g., images/PDFs).
- **Virus Scanning**: Integrate Clerk + external service pre-upload.
- **Private Files**: Set `access: 'private'`, use signed URLs:
  ```ts
  // Vercel: del({ token, pathname, access: 'private' });
  const { url } = await getSignedUrl({ token, pathname, expiresIn: 3600 });
  ```
- **Retention**: Cron job to purge old `deletedAt` records.
- **Limits**: Track via `useCredits` + `OperationType.StorageUpload`.
- **Costs**: Monitor provider billing; Vercel Blob is pay-per-use.

## Related Files
| Category | Files |
|----------|-------|
| **Core** | `src/lib/storage/index.ts`, `types.ts`, `vercel-blob.ts`, `replit.ts` |
| **API** | `src/app/api/upload/route.ts`, `src/app/api/admin/storage/[...path]/route.ts` |
| **Hooks** | `src/hooks/use-storage.ts`, `src/hooks/use-usage.ts` (tracks credits) |
| **UI** | `src/app/(protected)/ai-chat/page.tsx`, `src/app/admin/storage/page.tsx` |
| **Models** | Prisma `StorageObject` |
| **Utils** | `src/lib/api-client.ts` (for client calls) |

## Troubleshooting
- **No provider**: Check env vars; run `STORAGE_PROVIDER=vercel_blob npm run dev`.
- **Upload fails**: Verify token/bucket perms; check server logs.
- **Large files**: Increase `BLOB_MAX_SIZE_MB` or chunk.
- **CORS/Custom Domain**: Provider-specific; test public URLs.

For changes, extend `StorageProvider` interface and register in `src/lib/storage/index.ts`. See [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob) or [Replit SDK](https://docs.replit.com/reference/object-storage-javascript-sdk).
