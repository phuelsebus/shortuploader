import { Platform, PlatformStatus } from '../types';
import { StatusMap } from '../hooks/useUploadStatus';

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube Shorts',
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
};

interface UploadProgressProps {
  platforms: Platform[];
  statuses: StatusMap;
  onRetry?: (platform: Platform) => void;
}

export function UploadProgress({ platforms, statuses, onRetry }: UploadProgressProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-700">Upload progress</p>
      {platforms.map((platform) => (
        <div
          key={platform}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <span className="text-sm font-medium text-gray-800">{PLATFORM_LABELS[platform]}</span>
          <StatusBadge status={statuses[platform]} platform={platform} onRetry={onRetry} />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({
  status,
  platform,
  onRetry,
}: {
  status: PlatformStatus | undefined;
  platform: Platform;
  onRetry?: (platform: Platform) => void;
}) {
  if (!status || status.status === 'pending') {
    return <span className="text-xs text-gray-400">Waiting…</span>;
  }

  if (status.status === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
        <span className="animate-spin inline-block">⏳</span> Uploading
      </span>
    );
  }

  if (status.status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        ✅{' '}
        {status.url ? (
          <a href={status.url} target="_blank" rel="noreferrer" className="underline">
            View
          </a>
        ) : (
          'Done'
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs text-red-600">
      ❌ {status.error?.message ?? 'Failed'}
      {status.error?.retryable && onRetry && (
        <button
          onClick={() => onRetry(platform)}
          className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Retry
        </button>
      )}
    </span>
  );
}
