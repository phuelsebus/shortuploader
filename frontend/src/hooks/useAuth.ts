import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout } from "../services/api";
import { AuthUser } from "../types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  async function signOut() {
    await logout();
    queryClient.setQueryData(["me"], null);
    window.location.href = "/login";
  }

  return { user: user ?? null, isLoading, signOut };
}
