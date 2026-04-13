export type Platform = "youtube" | "tiktok" | "instagram";

export type UploadStatusValue = "pending" | "uploading" | "success" | "error";

export interface PlatformError {
  platform: Platform;
  code: string;
  message: string;
  retryable: boolean;
}

export interface PlatformStatus {
  status: UploadStatusValue;
  url?: string;
  error?: PlatformError;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConnectedPlatforms {
  youtube: boolean;
  tiktok: boolean;
  instagram: boolean;
}

export interface AuthUser {
  userId: string;
  connected: ConnectedPlatforms;
}
