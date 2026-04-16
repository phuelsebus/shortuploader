import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import passport from "passport";
import { Platform } from "../types";
import { getYouTubeAuthUrl, exchangeYouTubeCode } from "../services/youtube";
import { getTikTokAuthUrl, exchangeTikTokCode } from "../services/tiktok";
import {
  getInstagramAuthUrl,
  exchangeInstagramCode,
} from "../services/instagram";
import { deleteUserToken, getConnectedPlatforms } from "../utils/userStore";
import logger from "../utils/logger";

const router = Router();

const authUrlFns: Record<Platform, (state: string) => string> = {
  youtube: getYouTubeAuthUrl,
  tiktok: getTikTokAuthUrl,
  instagram: getInstagramAuthUrl,
};

const exchangeFns: Record<
  Platform,
  (code: string, userId: string) => Promise<void>
> = {
  youtube: exchangeYouTubeCode,
  tiktok: exchangeTikTokCode,
  instagram: exchangeInstagramCode,
};

const CLIENT_ORIGIN = () =>
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

// ── Google App Login ──────────────────────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_ORIGIN ?? "http://localhost:5173"}/login?error=google_failed`,
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id: string };
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.redirect(`${CLIENT_ORIGIN()}/dashboard`);
    });
  },
);

router.post(
  "/logout",
  (req: Request, res: Response, next: NextFunction): void => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  },
);

router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Not logged in" });
    return;
  }
  const connected = await getConnectedPlatforms(userId);
  res.json({ success: true, data: { userId, connected } });
});

// ── Platform OAuth ────────────────────────────────────────────────────────────

router.get("/:platform", (req: Request, res: Response): void => {
  const platform = req.params.platform as Platform;
  if (!authUrlFns[platform]) {
    res.status(404).json({ success: false, error: "Unknown platform" });
    return;
  }
  if (!req.session.userId) {
    res.status(401).json({ success: false, error: "Not logged in" });
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
    const userId = req.session.userId;

    if (
      !code ||
      state !== req.session.oauthState ||
      platform !== req.session.oauthPlatform ||
      !userId
    ) {
      res.redirect(`${CLIENT_ORIGIN()}/auth/error?reason=invalid_state`);
      return;
    }

    try {
      await exchangeFns[platform](code, userId);
      res.redirect(`${CLIENT_ORIGIN()}/auth/success?platform=${platform}`);
    } catch (err) {
      logger.error({ message: "OAuth exchange failed", platform, err });
      res.redirect(
        `${CLIENT_ORIGIN()}/auth/error?reason=exchange_failed&platform=${platform}`,
      );
    }
  },
);

router.delete(
  "/:platform",
  async (req: Request, res: Response): Promise<void> => {
    const platform = req.params.platform as Platform;
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Not logged in" });
      return;
    }
    await deleteUserToken(userId, platform);
    res.json({ success: true });
  },
);

export default router;
