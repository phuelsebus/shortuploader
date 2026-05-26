import "express-session";
import type { Platform } from "./index";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    oauthPlatform?: Platform;
    userId?: string;
    /** PKCE code_verifier for TikTok OAuth — generated per auth request */
    tiktokCodeVerifier?: string;
  }
}
