# Shorts Uploader

Upload a short-form video once and publish it simultaneously to **TikTok**, **Instagram Reels**, and **YouTube Shorts**.

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd shorts-uploader
npm run install:all
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your API credentials (see **Environment Variables** below).

Generate a `TOKEN_ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run in Development

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### 4. Build for Production

```bash
npm run build
# or
docker compose up --build
```

---

## API Credentials

Each platform requires an OAuth app. Register at:

| Platform | Developer Console |
|---|---|
| YouTube | [Google Cloud Console](https://console.cloud.google.com) — enable YouTube Data API v3 |
| TikTok | [TikTok for Developers](https://developers.tiktok.com) — request `video.publish` scope |
| Instagram | [Meta for Developers](https://developers.facebook.com) — Instagram Graph API |

Set each platform's redirect URI to:
```
http://localhost:3001/auth/<platform>/callback
```

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

---

## Architecture

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the full architecture, conventions, and API limitations.

---

## Known API Limitations

- **Instagram**: Requires the video to be at a publicly accessible URL before creating a Reels container. Set `INSTAGRAM_VIDEO_BASE_URL` to your storage bucket's public base URL.
- **TikTok**: `video.publish` scope requires app review. Use Sandbox mode with test accounts during development.
- **YouTube**: Shorts classification is automatic (9:16 aspect ratio, ≤60 s). `#shorts` is appended to the title automatically.
