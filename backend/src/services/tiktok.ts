import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import { UploadJob } from "../types";
import { getUserToken, setUserToken } from "../utils/userStore";
import logger from "../utils/logger";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";
const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize";

/** When TIKTOK_USE_SANDBOX=true, videos are posted as SELF_ONLY (not public). */
const isSandbox = process.env.TIKTOK_USE_SANDBOX === "true";

// ---------------------------------------------------------------------------
// PKCE helpers (TikTok requires S256 code_challenge)
// ---------------------------------------------------------------------------

export function generateCodeVerifier(): string {
  // 43–128 unreserved ASCII chars; 32 random bytes → 64 hex chars (within range)
  return crypto.randomBytes(32).toString("hex");
}

function codeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url"); // base64url (no padding, url-safe)
}

// ---------------------------------------------------------------------------

export function getTikTokAuthUrl(state: string, codeVerifier: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
    scope: "user.info.basic,video.publish",
    response_type: "code",
    redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/tiktok/callback`,
    state,
    code_challenge: codeChallenge(codeVerifier),
    code_challenge_method: "S256",
  });
  return `${TIKTOK_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeTikTokCode(
  code: string,
  userId: string,
  codeVerifier: string,
): Promise<void> {
  const response = await axios.post(
    "https://open.tiktokapis.com/v2/oauth/token/",
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/tiktok/callback`,
      code_verifier: codeVerifier,
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
  if (isSandbox) {
    logger.warn(
      "TikTok sandbox mode is active (TIKTOK_USE_SANDBOX=true). " +
        "Videos will be posted as SELF_ONLY and will not be publicly visible. " +
        "The video.publish scope still requires TikTok App Review for production use.",
    );
  }

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
        // Sandbox: limit visibility to the poster's own account for safe testing.
        // Production: PUBLIC_TO_EVERYONE (requires video.publish App Review approval).
        privacy_level: isSandbox ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE",
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

  logger.info({ message: "TikTok upload initiated", publish_id, isSandbox });
  // TikTok processes the video asynchronously; no immediate URL is returned.
  return undefined;
}
