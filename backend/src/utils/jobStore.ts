import { supabase } from "./supabaseClient";
import { UploadJob, Platform, PlatformStatus } from "../types";

// ---------------------------------------------------------------------------
// Supabase row shape
// ---------------------------------------------------------------------------

interface JobRow {
  job_id: string;
  user_id: string;
  title: string;
  description: string;
  tags: string[];
  platforms: string[];
  file_path: string;
  statuses: Record<string, PlatformStatus>;
  created_at: string;
}

function rowToJob(row: JobRow): UploadJob {
  return {
    jobId: row.job_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    platforms: row.platforms as Platform[],
    filePath: row.file_path,
    statuses: row.statuses as Record<Platform, PlatformStatus>,
    createdAt: new Date(row.created_at),
  };
}

export async function createJob(job: UploadJob): Promise<void> {
  const { error } = await supabase.from("upload_jobs").insert({
    job_id: job.jobId,
    user_id: job.userId,
    title: job.title,
    description: job.description,
    tags: job.tags,
    platforms: job.platforms,
    file_path: job.filePath,
    statuses: job.statuses,
  });
  if (error) throw new Error(`createJob failed: ${error.message}`);
}

export async function getJob(jobId: string): Promise<UploadJob | undefined> {
  const { data, error } = await supabase
    .from("upload_jobs")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (error || !data) return undefined;
  return rowToJob(data as JobRow);
}

export async function updateJob(
  jobId: string,
  update: Partial<UploadJob>,
): Promise<void> {
  const patch: Partial<JobRow> = {};
  if (update.title !== undefined) patch.title = update.title;
  if (update.description !== undefined) patch.description = update.description;
  if (update.tags !== undefined) patch.tags = update.tags;
  if (update.platforms !== undefined) patch.platforms = update.platforms;
  if (update.filePath !== undefined) patch.file_path = update.filePath;
  if (update.statuses !== undefined)
    patch.statuses = update.statuses as Record<string, PlatformStatus>;

  const { error } = await supabase
    .from("upload_jobs")
    .update(patch)
    .eq("job_id", jobId);

  if (error) throw new Error(`updateJob failed: ${error.message}`);
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from("upload_jobs")
    .delete()
    .eq("job_id", jobId);

  if (error) throw new Error(`deleteJob failed: ${error.message}`);
}
