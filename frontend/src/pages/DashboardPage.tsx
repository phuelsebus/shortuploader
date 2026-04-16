import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePlatformAuth } from "../hooks/usePlatformAuth";
import { Platform } from "../types";

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "youtube", label: "YouTube Shorts", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram Reels", icon: "📸" },
];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { connect, disconnect } = usePlatformAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect your social media accounts.
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Connected Accounts
          </p>
          {PLATFORMS.map((p) => {
            const isConnected = user?.connected[p.id] ?? false;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <span>{p.icon}</span> {p.label}
                  {isConnected && (
                    <span className="ml-1 text-xs text-green-600 font-semibold">
                      ✓ Connected
                    </span>
                  )}
                </span>
                {isConnected ? (
                  <button
                    onClick={() => void disconnect(p.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(p.id)}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
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
