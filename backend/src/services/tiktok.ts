import axios from "axios";
import fs from "fs";
import { UploadJob } from "../types";
import { getUserToken, setUserToken } from "../utils/userStore";
import logger from "../utils/logger";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";
const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize";

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
    scope: "user.info.basic,video.publish",
    response_type: "code",
    redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/tiktok/callback`,
    state,
  });
  return `${TIKTOK_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeTikTokCode(
  code: string,
  userId: string,
): Promise<void> {
  const response = await axios.post(
    "https://open.tiktokapis.com/v2/oauth/token/",
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/tiktok/callback`,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  await setUserToken(userId, "tiktok", response.data as object);
}

async function getAccessToken(userId: string): Promise<string> {
  const tokens = await getUserToken<{ access_token: string }>(userId, "tiktok");
  if (!tokens?.access_token) {
    throw Object.assign(new Error("TikTok not authenticated"), {
      platform: "tiktok",
      code: "NOT_AUTHENTICATED",
      retryable: false,
    });
  }
  return tokens.access_token;
}

export async function uploadToTikTok(
  job: UploadJob,
): Promise<string | undefined> {
  const accessToken = await getAccessToken(job.userId);
  const fileSize = fs.statSync(job.filePath).size;

  // Step 1: Initialise upload
  const initRes = await axios.post<{
    data: { publish_id: string; upload_url: string };
  }>(
    `${TIKTOK_API_BASE}/post/publish/video/init/`,
    {
      post_info: {
        title: job.title.slice(0, 2200),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
    },
  );

  const { publish_id, upload_url } = initRes.data.data;

  // Step 2: Upload file as a single chunk
  const fileBuffer = fs.readFileSync(job.filePath);
  await axios.put(upload_url, fileBuffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
      "Content-Length": fileBuffer.length,
    },
  });

  logger.info({ message: "TikTok upload initiated", publish_id });
  // TikTok processes the video asynchronously; no immediate URL is returned.
  return undefined;
}
