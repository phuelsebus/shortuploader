import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
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
    <div className="relative min-h-screen bg-[#080808] overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-violet-700/10 blur-[160px]" />
        <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-pink-700/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M4 4h4v4H4zm0 6h4v4H4zm0 6h4v4H4zm6-12h10v4H10zm0 6h10v4H10zm0 6h10v4H10z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/80">
              Shorts Uploader
            </span>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            New Upload
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            Upload once — publish to all platforms simultaneously.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 animate-slide-up"
        >
          {/* Dropzone */}
          <VideoDropzone onFile={setVideoFile} />

          {/* Metadata */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Video Details
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                Title <span className="text-pink-400">*</span>
              </label>
              <input
                {...register("title")}
                className="input-field"
                placeholder="My awesome short"
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="input-field resize-none"
                placeholder="Tell viewers what this is about…"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                Tags
              </label>
              <input
                {...register("tags")}
                className="input-field"
                placeholder="shorts, viral, funny (comma-separated)"
              />
            </div>
          </div>

          {/* Platform selector */}
          <div className="glass rounded-2xl p-6">
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </div>

          {upload.isError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-4 w-4 shrink-0 fill-red-400"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p className="text-sm text-red-400">
                {(upload.error as Error).message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!videoFile || platforms.length === 0 || isPublishing}
            className="btn-primary w-full"
          >
            {isPublishing ? (
              <>
                <Spinner />
                Publishing…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                Publish
              </>
            )}
          </button>
        </form>

        {jobId && (
          <div className="mt-4 animate-slide-up">
            <div className="glass rounded-2xl p-6">
              <UploadProgress platforms={platforms} statuses={statuses} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
