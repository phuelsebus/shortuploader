import { useEffect, useState } from 'react';
import { createStatusEventSource } from '../services/api';
import { Platform, PlatformStatus } from '../types';

export type StatusMap = Partial<Record<Platform, PlatformStatus>>;

type SSEPayload = ({ done: true } | ({ platform: Platform } & PlatformStatus));

export function useUploadStatus(jobId: string | null) {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    setStatuses({});
    setDone(false);

    const es = createStatusEventSource(jobId);

    es.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as SSEPayload;
      if ('done' in data && data.done) {
        setDone(true);
        es.close();
        return;
      }
      if ('platform' in data) {
        const { platform, ...status } = data;
        setStatuses((prev) => ({ ...prev, [platform]: status }));
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [jobId]);

  return { statuses, done };
}
