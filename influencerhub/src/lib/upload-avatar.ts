import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function assertAvatarFile(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF.");
  }
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  assertAvatarFile(file);
  const extFromType =
    file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp"
    : file.type === "image/gif" ? "gif"
    : "jpg";
  const path = `${userId}/avatar-${Date.now()}.${extFromType}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
