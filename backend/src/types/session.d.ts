import 'express-session';
import type { Platform } from './index';

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    oauthPlatform?: Platform;
  }
}
