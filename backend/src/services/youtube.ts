import { google } from "googleapis";
import fs from "fs";
import { UploadJob } from "../types";
import { getUserToken, setUserToken } from "../utils/userStore";
import logger from "../utils/logger";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/youtube/callback`,
  );
}

export function getYouTubeAuthUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
}

export async function exchangeYouTubeCode(code: string, userId: string): Promise<void> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  await setUserToken(userId, "youtube", tokens);
}

async function getAuthenticatedClient(userId: string) {
  const tokens = await getUserToken<Record<string, unknown>>(userId, "youtube");
  if (!tokens) {
    throw Object.assign(new Error("YouTube not authenticated"), {
      platform: "youtube",
      code: "NOT_AUTHENTICATED",
      retryable: false,
    });
  }
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  client.on("tokens", (newTokens) => {
    void setUserToken(userId, "youtube", { ...tokens, ...newTokens });
    logger.info("YouTube tokens refreshed");
  });
  return client;
}

export async function uploadToYouTube(
  job: UploadJob,
): Promise<string | undefined> {
  const auth = await getAuthenticatedClient(job.userId);
  const youtube = google.youtube({ version: "v3", auth });

  const title = job.title.includes("#shorts")
    ? job.title
    : `${job.title} #shorts`;

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description: job.description,
        tags: job.tags,
        categoryId: "22",
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: "video/mp4",
      body: fs.createReadStream(job.filePath),
    },
  });

  const videoId = response.data.id;
  return videoId ? `https://youtube.com/shorts/${videoId}` : undefined;
}
