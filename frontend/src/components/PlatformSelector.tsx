import { Platform } from '../types';

interface PlatformOption {
  id: Platform;
  label: string;
  icon: string;
  selectedClass: string;
  baseClass: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'youtube',
    label: 'YouTube Shorts',
    icon: '▶️',
    baseClass: 'border-red-200 bg-red-50 text-red-700',
    selectedClass: 'border-red-500 bg-red-100 ring-2 ring-red-400',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    baseClass: 'border-gray-200 bg-gray-50 text-gray-700',
    selectedClass: 'border-gray-800 bg-gray-200 ring-2 ring-gray-500',
  },
  {
    id: 'instagram',
    label: 'Instagram Reels',
    icon: '📸',
    baseClass: 'border-pink-200 bg-pink-50 text-pink-700',
    selectedClass: 'border-pink-500 bg-pink-100 ring-2 ring-pink-400',
  },
];

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const toggle = (id: Platform) => {
    onChange(selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-700">Publish to</p>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isSelected ? p.selectedClass : p.baseClass
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
              {isSelected && <span className="ml-1 text-xs font-bold">✓</span>}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-gray-400">Select at least one platform to publish.</p>
      )}
    </div>
  );
}
