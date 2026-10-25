import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function storeImage(
  file: File,
  key: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, buffer, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${key.replace(/[^a-zA-Z0-9-_]/g, "_")}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}
