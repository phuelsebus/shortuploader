import { Link } from "react-router-dom";
import { usePlatformAuth } from "../hooks/usePlatformAuth";
import { Platform } from "../types";

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
];

export function DashboardPage() {
  const { connect } = usePlatformAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect your social media accounts.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Connected Accounts
          </p>
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <span>{p.icon}</span> {p.label}
              </span>
              <button
                onClick={() => connect(p.id)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                Connect
              </button>
            </div>
          ))}
        </div>

        <Link
          to="/upload"
          className="block w-full rounded-xl bg-violet-600 py-3 text-center text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          New Upload
        </Link>
      </div>
    </div>
  );
}
