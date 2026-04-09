export type Platform = 'youtube' | 'tiktok' | 'instagram';

export type UploadStatusValue = 'pending' | 'uploading' | 'success' | 'error';

export interface PlatformStatus {
  status: UploadStatusValue;
  url?: string;
  error?: PlatformError;
}

export interface PlatformError {
  platform: Platform;
  code: string;
  message: string;
  retryable: boolean;
}

export interface UploadJob {
  jobId: string;
  title: string;
  description: string;
  tags: string[];
  platforms: Platform[];
  filePath: string;
  statuses: Record<Platform, PlatformStatus>;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
