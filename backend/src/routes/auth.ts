import { Router, Request, Response } from "express";
import crypto from "crypto";
import { Platform } from "../types";
import { getYouTubeAuthUrl, exchangeYouTubeCode } from "../services/youtube";
import { getTikTokAuthUrl, exchangeTikTokCode } from "../services/tiktok";
import {
  getInstagramAuthUrl,
  exchangeInstagramCode,
} from "../services/instagram";
import { deleteToken } from "../utils/tokenStore";
import logger from "../utils/logger";

const router = Router();

const authUrlFns: Record<Platform, (state: string) => string> = {
  youtube: getYouTubeAuthUrl,
  tiktok: getTikTokAuthUrl,
  instagram: getInstagramAuthUrl,
};

const exchangeFns: Record<Platform, (code: string) => Promise<void>> = {
  youtube: exchangeYouTubeCode,
  tiktok: exchangeTikTokCode,
  instagram: exchangeInstagramCode,
};

const CLIENT_ORIGIN = () =>
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

router.get("/:platform", (req: Request, res: Response): void => {
  const platform = req.params.platform as Platform;
  if (!authUrlFns[platform]) {
    res.status(404).json({ success: false, error: "Unknown platform" });
    return;
  }
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  req.session.oauthPlatform = platform;
  res.redirect(authUrlFns[platform](state));
});

router.get(
  "/:platform/callback",
  async (req: Request, res: Response): Promise<void> => {
    const platform = req.params.platform as Platform;
    const { code, state } = req.query as { code?: string; state?: string };

    if (
      !code ||
      state !== req.session.oauthState ||
      platform !== req.session.oauthPlatform
    ) {
      res.redirect(`${CLIENT_ORIGIN()}/auth/error?reason=invalid_state`);
      return;
    }

    try {
      await exchangeFns[platform](code);
      res.redirect(`${CLIENT_ORIGIN()}/auth/success?platform=${platform}`);
    } catch (err) {
      logger.error({ message: "OAuth exchange failed", platform, err });
      res.redirect(
        `${CLIENT_ORIGIN()}/auth/error?reason=exchange_failed&platform=${platform}`,
      );
    }
  },
);

router.delete("/:platform", (req: Request, res: Response): void => {
  const platform = req.params.platform as Platform;
  deleteToken(platform);
  res.json({ success: true });
});

export default router;
