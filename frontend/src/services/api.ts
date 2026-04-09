import { ApiResponse, Platform } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';
const AUTH_BASE = BASE.replace('/api', '');

export async function startUpload(formData: FormData): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = (await res.json()) as ApiResponse<{ jobId: string }>;
  if (!json.success || !json.data) throw new Error(json.error ?? 'Upload failed');
  return json.data;
}

export function connectPlatform(platform: Platform): void {
  window.location.href = `${AUTH_BASE}/auth/${platform}`;
}

export function disconnectPlatform(platform: Platform): Promise<void> {
  return fetch(`${AUTH_BASE}/auth/${platform}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(() => undefined);
}

export function createStatusEventSource(jobId: string): EventSource {
  return new EventSource(`${BASE}/status/${jobId}`, { withCredentials: true });
}
