import { Platform } from "../types";

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  youtube: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
};

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  instagram: "Instagram Reels",
};

const PLATFORM_COLORS: Record<
  Platform,
  { ring: string; bg: string; text: string; check: string }
> = {
  youtube: {
    ring: "ring-red-500",
    bg: "bg-red-500/15",
    text: "text-red-400",
    check: "bg-red-500",
  },
  tiktok: {
    ring: "ring-white/40",
    bg: "bg-white/10",
    text: "text-white/80",
    check: "bg-white/80",
  },
  instagram: {
    ring: "ring-pink-500",
    bg: "bg-gradient-to-br from-pink-500/15 to-purple-500/15",
    text: "text-pink-400",
    check: "bg-gradient-to-br from-pink-500 to-purple-500",
  },
};

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformSelector({
  selected,
  onChange,
}: PlatformSelectorProps) {
  const toggle = (id: Platform) => {
    onChange(
      selected.includes(id)
        ? selected.filter((p) => p !== id)
        : [...selected, id],
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
        Publish to
      </p>
      <div className="flex flex-col gap-2">
        {(Object.keys(PLATFORM_LABELS) as Platform[]).map((id) => {
          const isSelected = selected.includes(id);
          const colors = PLATFORM_COLORS[id];
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                isSelected
                  ? `border-transparent ${colors.bg} ring-1 ${colors.ring}`
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <span
                className={`${isSelected ? colors.text : "text-white/30"} transition-colors`}
              >
                {PLATFORM_ICONS[id]}
              </span>
              <span
                className={`flex-1 text-sm font-medium ${isSelected ? "text-white" : "text-white/50"}`}
              >
                {PLATFORM_LABELS[id]}
              </span>
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                  isSelected
                    ? `${colors.check} border-transparent`
                    : "border-white/20"
                }`}
              >
                {isSelected && (
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-white/25">
          Select at least one platform to publish.
        </p>
      )}
    </div>
  );
}
