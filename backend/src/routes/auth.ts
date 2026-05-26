import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import passport from "passport";
import { Platform } from "../types";
import { getYouTubeAuthUrl, exchangeYouTubeCode } from "../services/youtube";
import {
  getTikTokAuthUrl,
  exchangeTikTokCode,
  generateCodeVerifier,
} from "../services/tiktok";
import {
  getInstagramAuthUrl,
  exchangeInstagramCode,
} from "../services/instagram";
import { deleteUserToken, getConnectedPlatforms } from "../utils/userStore";
import logger from "../utils/logger";

const router = Router();

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

  if (!["youtube", "tiktok", "instagram"].includes(platform)) {
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

  let authUrl: string;

  if (platform === "tiktok") {
    // TikTok requires PKCE: generate code_verifier, derive code_challenge
    const codeVerifier = generateCodeVerifier();
    req.session.tiktokCodeVerifier = codeVerifier;
    authUrl = getTikTokAuthUrl(state, codeVerifier);
  } else if (platform === "instagram") {
    authUrl = getInstagramAuthUrl(state);
  } else {
    authUrl = getYouTubeAuthUrl(state);
  }

  logger.info({ message: "Redirecting to platform OAuth", platform, authUrl });
  res.redirect(authUrl);
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
      if (platform === "tiktok") {
        const codeVerifier = req.session.tiktokCodeVerifier;
        if (!codeVerifier) {
          res.redirect(
            `${CLIENT_ORIGIN()}/auth/error?reason=missing_code_verifier`,
          );
          return;
        }
        await exchangeTikTokCode(code, userId, codeVerifier);
        // Clean up verifier from session
        delete req.session.tiktokCodeVerifier;
      } else if (platform === "instagram") {
        await exchangeInstagramCode(code, userId);
      } else {
        await exchangeYouTubeCode(code, userId);
      }

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
