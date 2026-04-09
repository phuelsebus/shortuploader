# Shorts Uploader — Project Guidelines

## Project Overview

A full-stack web app that lets users upload a short-form video once and publish it simultaneously to **TikTok**, **Instagram Reels**, and **YouTube Shorts** via official APIs with OAuth 2.0 authentication.

## Architecture

**Monorepo** with two top-level packages:

```
shorts-uploader/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind CSS
├── backend/           # Node.js + Express + TypeScript
├── docker-compose.yml
└── .github/
```

### Frontend (`frontend/`)

- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Query (TanStack Query), React Hook Form, Zod
- **Key directories**:
  - `src/components/` — reusable UI primitives (VideoDropzone, PlatformSelector, UploadProgress)
  - `src/pages/` — route-level views (UploadPage, AuthCallbackPage, DashboardPage)
  - `src/hooks/` — custom React hooks (useUpload, usePlatformAuth, useUploadStatus)
  - `src/services/` — typed API client functions calling the backend REST API
  - `src/types/` — shared TypeScript interfaces (Platform, UploadJob, UploadStatus)

### Backend (`backend/`)

- **Stack**: Node.js 20 LTS, Express 5, TypeScript, Multer (multipart upload), googleapis, axios
- **Key directories**:
  - `src/routes/` — Express routers: `upload.ts`, `auth.ts`, `status.ts`
  - `src/services/` — one file per platform: `youtube.ts`, `tiktok.ts`, `instagram.ts`
  - `src/middleware/` — `authGuard.ts`, `errorHandler.ts`, `rateLimiter.ts`
  - `src/utils/` — `tokenStore.ts` (encrypted token persistence), `logger.ts`
  - `src/types/` — shared backend types

## Build and Test

```bash
# Install all dependencies (run from root)
npm run install:all       # installs frontend + backend deps

# Development (run concurrently from root)
npm run dev               # starts Vite dev server (port 5173) + Express (port 3001)

# Production build
npm run build             # builds frontend to frontend/dist, compiles backend TypeScript

# Tests
npm run test              # runs Vitest (frontend) + Jest (backend)
npm run test:e2e          # Playwright end-to-end tests
```

## API Integration Conventions

### Platform Support Status (important for agents to know)

| Platform | API | Upload Support | Notes |
|---|---|---|---|
| YouTube | YouTube Data API v3 | ✅ Full | `resumableUpload`, set `#shorts` in title |
| TikTok | Content Posting API v2 | ✅ Direct post | Requires app approval; use `DIRECT_POST` or `INBOX` flow |
| Instagram | Graph API | ⚠️ Reels only | Two-step: create container → publish; 24h token refresh required |

### OAuth Flow

- All OAuth redirects go through the backend at `/auth/:platform/callback`
- Access tokens are encrypted with AES-256 (key from `TOKEN_ENCRYPTION_KEY` env var) before storage
- **Never** log or expose raw tokens; use the `tokenStore` utility for all read/write operations
- Frontend only receives a session cookie; tokens never cross to the browser

### Upload Pipeline (backend)

1. Client sends `multipart/form-data` to `POST /api/upload` (title, description, tags, platforms[], video file)
2. Multer buffers to `UPLOAD_TMP_DIR`; max file size validated server-side (512 MB)
3. An `UploadJob` is created with a `jobId`; SSE stream opened at `GET /api/status/:jobId`
4. Each platform upload runs independently in parallel (Promise.allSettled)
5. Per-platform status emitted via SSE: `pending → uploading → success | error`
6. Temp file deleted after all platform tasks complete or fail

## Conventions

### TypeScript

- Strict mode enabled (`"strict": true` in both tsconfigs)
- `Platform` is a string union type: `"youtube" | "tiktok" | "instagram"` — never use magic strings elsewhere
- All API responses from the backend are typed with a generic `ApiResponse<T>` wrapper

### Error Handling

- Backend: all route handlers use the central `errorHandler` middleware; never `res.send()` raw errors
- Platform API errors are caught, normalized to `PlatformError` (`{ platform, code, message, retryable }`), and stored on the job
- Frontend: React Query's `onError` feeds a toast notification system; show per-platform retry buttons for `retryable: true` errors

### Security

- CORS whitelist configured in Express — only allow the Vite origin in dev, production origin in prod
- OAuth `state` parameter is a CSRF nonce stored in the session; verified on callback
- File uploads validated by MIME type (`video/mp4`, `video/quicktime`) **and** magic bytes, not just extension
- Rate limiting on `/api/upload` (configurable via env) to prevent abuse
- All secrets loaded from environment variables — never hardcoded

### Environment Variables

Backend `.env` (see `backend/.env.example`):

```
YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
TOKEN_ENCRYPTION_KEY          # 32-byte hex for AES-256
SESSION_SECRET
UPLOAD_TMP_DIR                # absolute path, default /tmp/shorts-uploader
PORT                          # default 3001
CLIENT_ORIGIN                 # e.g. http://localhost:5173
```

Frontend `.env`:

```
VITE_API_BASE_URL             # e.g. http://localhost:3001/api
```

## UI/UX Patterns

- **Upload flow**: VideoDropzone → MetadataForm → PlatformSelector → Publish button → live UploadProgress panel
- UploadProgress shows per-platform status cards with spinner → checkmark/error, driven by SSE events
- Tailwind design tokens used throughout; no inline styles
- Mobile-first responsive layout (single-column on small screens, two-column on desktop)

## Known API Limitations

- **Instagram**: Direct video upload to Reels requires the video URL to be publicly accessible before starting the container (use a short-lived signed URL or upload to a temporary public storage first)
- **TikTok**: Upload scope `video.publish` requires app review; during development, use the Sandbox environment with test accounts
- **YouTube**: Shorts are regular uploads; the platform classifies as a Short based on aspect ratio (9:16) and ≤60 s duration; always append `#shorts` to the title

## Key Reference Files (once created)

- `backend/src/services/youtube.ts` — canonical example of a platform service (resumable upload, token refresh)
- `frontend/src/components/VideoDropzone.tsx` — canonical example of a UI component (drag & drop, validation, preview)
- `backend/src/utils/tokenStore.ts` — canonical example of secure token handling
