import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime"];
const MAX_SIZE_BYTES = 512 * 1024 * 1024;

interface VideoDropzoneProps {
  onFile: (file: File) => void;
}

export function VideoDropzone({ onFile }: VideoDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only MP4 and MOV files are supported.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("File must be smaller than 512 MB.");
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      onFile(file);
    },
    [onFile, preview],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload video"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-300 ${
          dragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
            : preview
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        }`}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-emerald-400">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/70">{fileName}</p>
            <p className="text-xs text-white/30">Click to replace</p>
          </div>
        ) : (
          <>
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-violet-500/20" : "bg-white/5"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-7 w-7 transition-colors ${dragging ? "fill-violet-400" : "fill-white/30"}`}
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/70">
              {dragging ? "Drop your video here" : "Drag & drop your video"}
            </p>
            <p className="mt-1 text-xs text-white/30">
              MP4 or MOV · max 512 MB
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/50">
              Browse file
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-red-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {preview && (
        <video
          src={preview}
          controls
          className="rounded-2xl max-h-64 w-full object-contain bg-black/50 border border-white/5"
        />
      )}
    </div>
  );
}
