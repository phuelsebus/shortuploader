import { UploadJob } from '../types';

const jobs = new Map<string, UploadJob>();

export function createJob(job: UploadJob): void {
  jobs.set(job.jobId, job);
}

export function getJob(jobId: string): UploadJob | undefined {
  return jobs.get(jobId);
}

export function updateJob(jobId: string, update: Partial<UploadJob>): void {
  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, ...update });
  }
}

export function deleteJob(jobId: string): void {
  jobs.delete(jobId);
}
