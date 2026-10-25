import { LISTING_IMAGES_BUCKET } from "@/lib/supabase/constants";

export function isAllowedListingImageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
  return url.startsWith(prefix);
}
