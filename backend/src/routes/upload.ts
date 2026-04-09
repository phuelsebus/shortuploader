import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Platform, UploadJob } from "../types";
import { uploadRateLimiter } from "../middleware/rateLimiter";
import { createJob } from "../utils/jobStore";
import { uploadToYouTube } from "../services/youtube";
import { uploadToTikTok } from "../services/tiktok";
import { uploadToInstagram } from "../services/instagram";
import { emitStatus, emitDone } from "../utils/sseManager";
import logger from "../utils/logger";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime"];
const UPLOAD_DIR = process.env.UPLOAD_TMP_DIR ?? "/tmp/shorts-uploader";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = Router();

type Uploader = (job: UploadJob) => Promise<string | undefined>;

const uploaders: Record<Platform, Uploader> = {
  youtube: uploadToYouTube,
  tiktok: uploadToTikTok,
  instagram: uploadToInstagram,
};

async function runUploads(
  jobId: string,
  platforms: Platform[],
  job: UploadJob,
): Promise<void> {
  await Promise.allSettled(
    platforms.map(async (platform) => {
      emitStatus(jobId, platform, { status: "uploading" });
      try {
        const url = await uploaders[platform](job);
        emitStatus(jobId, platform, { status: "success", url });
      } catch (err: unknown) {
        const e = err as {
          platform?: Platform;
          code?: string;
          message?: string;
          retryable?: boolean;
        };
        emitStatus(jobId, platform, {
          status: "error",
          error: {
            platform: e.platform ?? platform,
            code: e.code ?? "UNKNOWN",
            message: e.message ?? "Unknown error",
            retryable: e.retryable ?? false,
          },
        });
        logger.error({ platform, err });
      }
    }),
  );

  emitDone(jobId);

  try {
    fs.unlinkSync(job.filePath);
  } catch {
    logger.warn(`Failed to delete temp file: ${job.filePath}`);
  }
}

router.post(
  "/",
  uploadRateLimiter,
  upload.single("video"),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No video file provided" });
      return;
    }

    // Validate MP4 magic bytes (ftyp/moov box at offset 4)
    if (file.mimetype === "video/mp4") {
      const fd = fs.openSync(file.path, "r");
      const header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);
      const fourCC = header.slice(4, 8).toString("ascii");
      const validBoxes = ["ftyp", "moov", "mdat", "wide", "skip"];
      if (!validBoxes.includes(fourCC)) {
        fs.unlinkSync(file.path);
        res.status(400).json({ success: false, error: "Invalid MP4 file" });
        return;
      }
    }

    const { title, description } = req.body as {
      title?: string;
      description?: string;
    };
    const tags: string[] =
      typeof req.body.tags === "string"
        ? (JSON.parse(req.body.tags) as string[])
        : [];
    const platforms: Platform[] =
      typeof req.body.platforms === "string"
        ? (JSON.parse(req.body.platforms) as Platform[])
        : [];

    if (!title || platforms.length === 0) {
      fs.unlinkSync(file.path);
      res
        .status(400)
        .json({
          success: false,
          error: "title and at least one platform are required",
        });
      return;
    }

    const jobId = uuidv4();
    const job: UploadJob = {
      jobId,
      title,
      description: description ?? "",
      tags,
      platforms,
      filePath: file.path,
      statuses: Object.fromEntries(
        platforms.map((p) => [p, { status: "pending" as const }]),
      ) as Record<Platform, { status: "pending" }>,
      createdAt: new Date(),
    };

    createJob(job);
    res.json({ success: true, data: { jobId } });

    // Fire-and-forget: uploads run after the response is sent
    void runUploads(jobId, platforms, job);
  },
);

export default router;
