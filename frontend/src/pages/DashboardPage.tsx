import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePlatformAuth } from "../hooks/usePlatformAuth";
import { Platform } from "../types";

const PLATFORMS: {
  id: Platform;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}[] = [
  {
    id: "youtube",
    label: "YouTube",
    sublabel: "Shorts",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.05 0 12 0 12s0 3.95.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.95 24 12 24 12s0-3.95-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
      </svg>
    ),
    color: "text-red-400",
    glow: "group-hover:shadow-red-900/40",
  },
  {
    id: "tiktok",
    label: "TikTok",
    sublabel: "Videos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.79a4.85 4.85 0 0 1-1.01-.1z" />
      </svg>
    ),
    color: "text-white",
    glow: "group-hover:shadow-white/10",
  },
  {
    id: "instagram",
    label: "Instagram",
    sublabel: "Reels",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    color: "text-pink-400",
    glow: "group-hover:shadow-pink-900/40",
  },
];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { connect, disconnect } = usePlatformAuth();

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 -right-60 h-[500px] w-[500px] rounded-full bg-violet-700/10 blur-[140px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-pink-700/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-6 py-10">
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
          <button
            onClick={() => void signOut()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {/* Title */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Connected Accounts
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            Link your social platforms to start publishing.
          </p>
        </div>

        {/* Platform cards */}
        <div className="space-y-3 animate-slide-up">
          {PLATFORMS.map((p) => {
            const isConnected = user?.connected[p.id] ?? false;
            return (
              <div
                key={p.id}
                className={`group glass rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.06] ${isConnected ? "shadow-lg" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${isConnected ? "bg-white/10" : "bg-white/5"} ${p.color}`}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {p.label}
                        </span>
                        <span className="text-xs text-white/40">
                          {p.sublabel}
                        </span>
                      </div>
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>

                  {isConnected ? (
                    <button
                      onClick={() => void disconnect(p.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => connect(p.id)}
                      className="rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:from-violet-500 hover:to-pink-500 hover:shadow-lg hover:shadow-violet-900/30"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6 animate-slide-up">
          <Link to="/upload" className="btn-primary w-full">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            New Upload
          </Link>
        </div>
      </div>
    </div>
  );
}
