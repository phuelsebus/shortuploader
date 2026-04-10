import { supabase } from "./supabaseClient";
import { encrypt, decrypt } from "./crypto";

export interface UserRecord {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Upsert user after Google login
export async function upsertUser(user: UserRecord): Promise<void> {
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`upsertUser failed: ${error.message}`);
}

// Save encrypted platform token for a user
export async function setUserToken(
  userId: string,
  platform: "youtube" | "tiktok" | "instagram",
  token: object,
): Promise<void> {
  const encrypted = encrypt(JSON.stringify(token));
  const { error } = await supabase
    .from("users")
    .update({ [`${platform}_token`]: encrypted })
    .eq("id", userId);
  if (error) throw new Error(`setUserToken failed: ${error.message}`);
}

// Load and decrypt platform token for a user
export async function getUserToken<T>(
  userId: string,
  platform: "youtube" | "tiktok" | "instagram",
): Promise<T | null> {
  const { data, error } = await supabase
    .from("users")
    .select(`${platform}_token`)
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const encrypted = (data as Record<string, string | null>)[`${platform}_token`];
  if (!encrypted) return null;

  try {
    return JSON.parse(decrypt(encrypted)) as T;
  } catch {
    return null;
  }
}

// Remove platform token for a user
export async function deleteUserToken(
  userId: string,
  platform: "youtube" | "tiktok" | "instagram",
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ [`${platform}_token`]: null })
    .eq("id", userId);
  if (error) throw new Error(`deleteUserToken failed: ${error.message}`);
}

// Get which platforms a user has connected
export async function getConnectedPlatforms(
  userId: string,
): Promise<{ youtube: boolean; tiktok: boolean; instagram: boolean }> {
  const { data, error } = await supabase
    .from("users")
    .select("youtube_token, tiktok_token, instagram_token")
    .eq("id", userId)
    .single();

  if (error || !data) return { youtube: false, tiktok: false, instagram: false };
  const d = data as Record<string, string | null>;
  return {
    youtube: !!d.youtube_token,
    tiktok: !!d.tiktok_token,
    instagram: !!d.instagram_token,
  };
}
