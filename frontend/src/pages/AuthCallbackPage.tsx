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
    const timer = setTimeout(() => void navigate("/upload"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50">
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center max-w-sm w-full">
        <span className="text-5xl">{isError ? "❌" : "✅"}</span>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          {isError
            ? "Authentication failed"
            : `${platform ?? "Platform"} connected!`}
        </h2>
        {isError && reason && (
          <p className="mt-2 text-sm text-gray-500 capitalize">
            {reason.replace(/_/g, " ")}
          </p>
        )}
        <p className="mt-3 text-sm text-gray-400">
          Redirecting you back in 3 seconds…
        </p>
      </div>
    </div>
  );
}
