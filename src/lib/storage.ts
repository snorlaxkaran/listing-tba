import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  createSupabaseAdmin,
  LISTING_IMAGES_BUCKET,
} from "@/lib/supabase/admin";

const MAX_BYTES = 12 * 1024 * 1024;

export async function storeImage(file: File, key: string): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 12 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const objectPath = `${key.replace(/[^a-zA-Z0-9-_/]/g, "_")}${ext}`;

  const supabase = createSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });
    if (error) {
      throw new Error(
        `Supabase upload failed: ${error.message}. Create a public bucket named "${LISTING_IMAGES_BUCKET}" in Storage.`,
      );
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(data.path);
    return publicUrl;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(objectPath, buffer, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image upload is not configured on Vercel. Add SUPABASE_SERVICE_ROLE_KEY (and Storage bucket listing-images) or BLOB_READ_WRITE_TOKEN.",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filename = objectPath.replace(/\//g, "_");
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}
