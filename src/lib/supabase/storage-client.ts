"use client";

import { compressImageFile } from "@/lib/compress-image";
import { createSupabaseClient } from "@/lib/supabase/client";
import { LISTING_IMAGES_BUCKET } from "@/lib/supabase/constants";

const MAX_BYTES = 12 * 1024 * 1024;

export async function uploadListingImageClient(
  file: File,
  objectPath: string,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 12 MB or smaller.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const compressed = await compressImageFile(file);
  const uploadPath = objectPath.replace(/\.[^.]+$/, "") + ".jpg";

  const supabase = createSupabaseClient();
  const { error } = await supabase.storage
    .from(LISTING_IMAGES_BUCKET)
    .upload(uploadPath, compressed, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (error) {
    if (error.message.toLowerCase().includes("bucket")) {
      throw new Error(
        `Create a public Storage bucket named "${LISTING_IMAGES_BUCKET}" in Supabase, then run supabase/storage-policies.sql.`,
      );
    }
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(uploadPath);
  return publicUrl;
}
