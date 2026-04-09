import { Response } from "express";
import { Platform, PlatformStatus } from "../types";

const clients = new Map<string, Response>();

export function registerClient(jobId: string, res: Response): void {
  clients.set(jobId, res);
}

export function removeClient(jobId: string): void {
  clients.delete(jobId);
}

export function emitStatus(
  jobId: string,
  platform: Platform,
  status: PlatformStatus,
): void {
  const res = clients.get(jobId);
  if (res) {
    res.write(`data: ${JSON.stringify({ platform, ...status })}\n\n`);
  }
}

export function emitDone(jobId: string): void {
  const res = clients.get(jobId);
  if (res) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    clients.delete(jobId);
  }
}
