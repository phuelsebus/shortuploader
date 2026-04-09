import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime"];
const MAX_SIZE_BYTES = 512 * 1024 * 1024;

interface VideoDropzoneProps {
  onFile: (file: File) => void;
}

export function VideoDropzone({ onFile }: VideoDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
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
    <div className="flex flex-col gap-4">
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
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors duration-200 ${
          dragging
            ? "border-violet-500 bg-violet-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <span className="text-4xl mb-3">🎬</span>
        <p className="text-sm font-medium text-gray-700">
          Drag & drop your video here
        </p>
        <p className="text-xs text-gray-500 mt-1">MP4 or MOV · max 512 MB</p>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {preview && (
        <video
          src={preview}
          controls
          className="rounded-xl max-h-64 w-full object-contain bg-black"
        />
      )}
    </div>
  );
}
