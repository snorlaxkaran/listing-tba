import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_* in environment");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(
  __dirname,
  "..",
  "..",
  ".cursor",
  "projects",
  "c-Users-karan-sample-listing-tracker",
  "assets",
);

const files = [
  "c__Users_karan_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_37154_1_b0c31ca6d044480eb782a810c6529385-92e17e45-2c84-4e6a-a9c8-f1934bb82934.png",
  "c__Users_karan_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_37154_2_130f6bf2cf1f42c1b23cb2dc075987e4-5be7231c-7d05-41fa-af40-6e5baafbd03a.png",
];

const supabase = createClient(url, key);

for (const name of files) {
  const filePath = path.join(assets, name);
  const buf = await readFile(filePath);
  const objectPath = `test/${Date.now()}-${name.slice(-20)}`;
  const { data, error } = await supabase.storage
    .from("listing-images")
    .upload(objectPath, buf, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) {
    console.error("FAIL", name, error.message);
    process.exit(1);
  }
  const { data: pub } = supabase.storage
    .from("listing-images")
    .getPublicUrl(data.path);
  console.log("OK", pub.publicUrl);
}
