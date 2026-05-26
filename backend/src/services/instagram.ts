import axios from "axios";
import path from "path";
import { UploadJob } from "../types";
import { getUserToken, setUserToken } from "../utils/userStore";
import { uploadToS3, deleteFromS3 } from "../utils/storageService";
import logger from "../utils/logger";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
// Instagram Graph API base (new Instagram API, replaces deprecated Basic Display API)
const INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com";
const CONTAINER_POLL_INTERVAL_MS = 5_000;
const CONTAINER_POLL_RETRIES = 12; // max 60 s

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/instagram/callback`,
    scope: "instagram_basic,instagram_content_publish",
    response_type: "code",
    state,
  });
  // New Instagram API with Instagram Login (Basic Display API deprecated Sept 2024)
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(
  code: string,
  userId: string,
): Promise<void> {
  // Exchange code for short-lived token
  const shortLived = await axios.post<{
    access_token: string;
    user_id: string;
  }>(
    "https://api.instagram.com/oauth/access_token",
    new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID ?? "",
      client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
      grant_type: "authorization_code",
      redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/instagram/callback`,
      code,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  // Exchange for long-lived token (valid 60 days) via new Instagram Graph API
  const longLived = await axios.get<{
    access_token: string;
    expires_in: number;
  }>(`${INSTAGRAM_GRAPH_BASE}/access_token`, {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      access_token: shortLived.data.access_token,
    },
  });

  await setUserToken(userId, "instagram", {
    access_token: longLived.data.access_token,
    user_id: shortLived.data.user_id,
    expires_in: longLived.data.expires_in,
  });
}

async function getCredentials(userId: string): Promise<{
  accessToken: string;
  igUserId: string;
}> {
  const tokens = await getUserToken<{ access_token: string; user_id: string }>(
    userId,
    "instagram",
  );
  if (!tokens?.access_token) {
    throw Object.assign(new Error("Instagram not authenticated"), {
      platform: "instagram",
      code: "NOT_AUTHENTICATED",
      retryable: false,
    });
  }
  return { accessToken: tokens.access_token, igUserId: tokens.user_id };
}

export async function uploadToInstagram(
  job: UploadJob,
): Promise<string | undefined> {
  const { accessToken, igUserId } = await getCredentials(job.userId);

  // Determine video URL:
  // - If INSTAGRAM_VIDEO_BASE_URL is set, use the static base URL (legacy / manual hosting).
  // - Otherwise, upload the file to S3 automatically and use the resulting public URL.
  const baseUrl = process.env.INSTAGRAM_VIDEO_BASE_URL;
  let videoUrl: string;
  let uploadedToS3 = false;

  if (baseUrl) {
    videoUrl = `${baseUrl}/${path.basename(job.filePath)}`;
  } else {
    videoUrl = await uploadToS3(job.filePath);
    uploadedToS3 = true;
  }
  const caption = [
    job.title,
    job.description,
    job.tags.map((t) => `#${t}`).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  // Step 1: Create media container
  const containerRes = await axios.post<{ id: string }>(
    `${GRAPH_API_BASE}/${igUserId}/media`,
    null,
    {
      params: {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      },
    },
  );
  const containerId = containerRes.data.id;

  // Step 2: Poll until the container is ready
  for (let i = 0; i < CONTAINER_POLL_RETRIES; i++) {
    await new Promise((r) => setTimeout(r, CONTAINER_POLL_INTERVAL_MS));
    const statusRes = await axios.get<{ status_code: string }>(
      `${GRAPH_API_BASE}/${containerId}`,
      {
        params: { fields: "status_code", access_token: accessToken },
      },
    );
    if (statusRes.data.status_code === "FINISHED") break;
    if (statusRes.data.status_code === "ERROR") {
      throw Object.assign(
        new Error("Instagram media container processing failed"),
        {
          platform: "instagram",
          code: "CONTAINER_ERROR",
          retryable: true,
        },
      );
    }
    if (i === CONTAINER_POLL_RETRIES - 1) {
      throw Object.assign(new Error("Instagram media container timed out"), {
        platform: "instagram",
        code: "CONTAINER_TIMEOUT",
        retryable: true,
      });
    }
  }

  // Step 3: Publish
  const publishRes = await axios.post<{ id: string }>(
    `${GRAPH_API_BASE}/${igUserId}/media_publish`,
    null,
    { params: { creation_id: containerId, access_token: accessToken } },
  );

  const mediaId = publishRes.data.id;
  logger.info({ message: "Instagram Reel published", mediaId });

  // Clean up the S3 object after a successful publish (only if we uploaded it).
  if (uploadedToS3) {
    await deleteFromS3(job.filePath);
  }

  return `https://www.instagram.com/reel/${mediaId}/`;
}
