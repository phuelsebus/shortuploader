import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VideoDropzone } from "../components/VideoDropzone";
import { PlatformSelector } from "../components/PlatformSelector";
import { UploadProgress } from "../components/UploadProgress";
import { useUpload } from "../hooks/useUpload";
import { useUploadStatus } from "../hooks/useUploadStatus";
import { Platform } from "../types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  description: z.string().max(2200, "Max 2200 characters").optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const upload = useUpload();
  const { statuses, done } = useUploadStatus(jobId);

  const onSubmit = async (values: FormValues) => {
    if (!videoFile || platforms.length === 0) return;
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const result = await upload.mutateAsync({
      video: videoFile,
      title: values.title,
      description: values.description ?? "",
      tags,
      platforms,
    });
    setJobId(result.jobId);
  };

  const isPublishing = upload.isPending || (!!jobId && !done);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shorts Uploader</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload once, publish everywhere.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <VideoDropzone onFile={setVideoFile} />

          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="My awesome short"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Tell viewers what this is about…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                {...register("tags")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="shorts, viral, funny (comma-separated)"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </div>

          {upload.isError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {(upload.error as Error).message}
            </p>
          )}

          <button
            type="submit"
            disabled={!videoFile || platforms.length === 0 || isPublishing}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        </form>

        {jobId && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <UploadProgress platforms={platforms} statuses={statuses} />
          </div>
        )}
      </div>
    </div>
  );
}
