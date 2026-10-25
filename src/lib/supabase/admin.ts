import { createClient } from "@supabase/supabase-js";
import { LISTING_IMAGES_BUCKET } from "@/lib/supabase/constants";

export { LISTING_IMAGES_BUCKET };

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
