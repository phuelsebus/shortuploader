import axios from 'axios';
import path from 'path';
import { UploadJob } from '../types';
import { getToken, setToken } from '../utils/tokenStore';
import logger from '../utils/logger';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';
const CONTAINER_POLL_INTERVAL_MS = 5_000;
const CONTAINER_POLL_RETRIES = 12; // max 60 s

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? '',
    redirect_uri: `${process.env.SERVER_ORIGIN ?? 'http://localhost:3001'}/auth/instagram/callback`,
    scope: 'instagram_basic,instagram_content_publish',
    response_type: 'code',
    state,
  });
  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string): Promise<void> {
  // Exchange code for short-lived token
  const shortLived = await axios.post<{ access_token: string; user_id: string }>(
    'https://api.instagram.com/oauth/access_token',
    new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID ?? '',
      client_secret: process.env.INSTAGRAM_APP_SECRET ?? '',
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.SERVER_ORIGIN ?? 'http://localhost:3001'}/auth/instagram/callback`,
      code,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  // Exchange for long-lived token (valid 60 days)
  const longLived = await axios.get<{ access_token: string; expires_in: number }>(
    `${GRAPH_API_BASE}/oauth/access_token`,
    {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        access_token: shortLived.data.access_token,
      },
    },
  );

  setToken('instagram', {
    access_token: longLived.data.access_token,
    user_id: shortLived.data.user_id,
    expires_in: longLived.data.expires_in,
  });
}

async function getCredentials(): Promise<{ accessToken: string; userId: string }> {
  const tokens = getToken<{ access_token: string; user_id: string }>('instagram');
  if (!tokens?.access_token) {
    throw Object.assign(new Error('Instagram not authenticated'), {
      platform: 'instagram',
      code: 'NOT_AUTHENTICATED',
      retryable: false,
    });
  }
  return { accessToken: tokens.access_token, userId: tokens.user_id };
}

export async function uploadToInstagram(job: UploadJob): Promise<string | undefined> {
  const { accessToken, userId } = await getCredentials();

  // Instagram requires a publicly accessible video URL before creating a container.
  // Set INSTAGRAM_VIDEO_BASE_URL to your public storage bucket base URL.
  const baseUrl = process.env.INSTAGRAM_VIDEO_BASE_URL;
  if (!baseUrl) {
    throw Object.assign(
      new Error(
        'Instagram Reels upload requires INSTAGRAM_VIDEO_BASE_URL — ' +
          'a publicly accessible base URL where the video file is hosted (e.g. S3, GCS). ' +
          'Upload the file there first and set this environment variable.',
      ),
      { platform: 'instagram', code: 'REQUIRES_PUBLIC_URL', retryable: false },
    );
  }

  const videoUrl = `${baseUrl}/${path.basename(job.filePath)}`;
  const caption = [job.title, job.description, job.tags.map((t) => `#${t}`).join(' ')]
    .filter(Boolean)
    .join('\n\n');

  // Step 1: Create media container
  const containerRes = await axios.post<{ id: string }>(`${GRAPH_API_BASE}/${userId}/media`, null, {
    params: {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    },
  });
  const containerId = containerRes.data.id;

  // Step 2: Poll until the container is ready
  for (let i = 0; i < CONTAINER_POLL_RETRIES; i++) {
    await new Promise((r) => setTimeout(r, CONTAINER_POLL_INTERVAL_MS));
    const statusRes = await axios.get<{ status_code: string }>(`${GRAPH_API_BASE}/${containerId}`, {
      params: { fields: 'status_code', access_token: accessToken },
    });
    if (statusRes.data.status_code === 'FINISHED') break;
    if (statusRes.data.status_code === 'ERROR') {
      throw Object.assign(new Error('Instagram media container processing failed'), {
        platform: 'instagram',
        code: 'CONTAINER_ERROR',
        retryable: true,
      });
    }
    if (i === CONTAINER_POLL_RETRIES - 1) {
      throw Object.assign(new Error('Instagram media container timed out'), {
        platform: 'instagram',
        code: 'CONTAINER_TIMEOUT',
        retryable: true,
      });
    }
  }

  // Step 3: Publish
  const publishRes = await axios.post<{ id: string }>(
    `${GRAPH_API_BASE}/${userId}/media_publish`,
    null,
    { params: { creation_id: containerId, access_token: accessToken } },
  );

  const mediaId = publishRes.data.id;
  logger.info({ message: 'Instagram Reel published', mediaId });
  return `https://www.instagram.com/reel/${mediaId}/`;
}
