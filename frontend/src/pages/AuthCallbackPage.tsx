import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isError = pathname.includes("error");
  const platform = params.get("platform");
  const reason = params.get("reason");

  useEffect(() => {
    const timer = setTimeout(() => void navigate("/dashboard"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-[#080808] flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-[140px] ${isError ? "bg-red-700/15" : "bg-emerald-700/15"}`}
        />
      </div>

      <div className="relative z-10 animate-slide-up glass rounded-2xl p-10 text-center max-w-sm w-full mx-6 shadow-2xl">
        {isError ? (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-red-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
        ) : (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-emerald-400">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        )}

        <h2 className="text-lg font-bold text-white">
          {isError
            ? "Authentication failed"
            : `${platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Platform"} connected!`}
        </h2>

        {isError && reason && (
          <p className="mt-2 text-sm text-white/40 capitalize">
            {reason.replace(/_/g, " ")}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/30">
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
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
          Redirecting in 3 seconds…
        </div>
      </div>
    </div>
  );
}
