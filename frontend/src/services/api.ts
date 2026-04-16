import { ApiResponse, AuthUser, Platform } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
const AUTH_BASE = BASE.replace("/api", "");

export async function startUpload(
  formData: FormData,
): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const json = (await res.json()) as ApiResponse<{ jobId: string }>;
  if (!json.success || !json.data)
    throw new Error(json.error ?? "Upload failed");
  return json.data;
}

export function loginWithGoogle(): void {
  window.location.href = `${AUTH_BASE}/auth/google`;
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch(`${AUTH_BASE}/auth/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  const json = (await res.json()) as ApiResponse<AuthUser>;
  return json.data ?? null;
}

export function connectPlatform(platform: Platform): void {
  window.location.href = `${AUTH_BASE}/auth/${platform}`;
}

export function disconnectPlatform(platform: Platform): Promise<void> {
  return fetch(`${AUTH_BASE}/auth/${platform}`, {
    method: "DELETE",
    credentials: "include",
  }).then(() => undefined);
}

export function createStatusEventSource(jobId: string): EventSource {
  return new EventSource(`${BASE}/status/${jobId}`, { withCredentials: true });
}
