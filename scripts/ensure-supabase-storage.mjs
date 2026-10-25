import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `insert into storage.buckets (id, name, public)
   values ('listing-images', 'listing-images', true)
   on conflict (id) do update set public = true, name = excluded.name`,
  `drop policy if exists "listing_images_public_read" on storage.objects`,
  `create policy "listing_images_public_read"
   on storage.objects for select to public
   using (bucket_id = 'listing-images')`,
  `drop policy if exists "listing_images_anon_upload" on storage.objects`,
  `create policy "listing_images_anon_upload"
   on storage.objects for insert to anon, authenticated
   with check (bucket_id = 'listing-images')`,
  `drop policy if exists "listing_images_anon_update" on storage.objects`,
  `create policy "listing_images_anon_update"
   on storage.objects for update to anon, authenticated
   using (bucket_id = 'listing-images')`,
];

async function main() {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
    console.log("OK:", sql.slice(0, 60).replace(/\s+/g, " ") + "…");
  }
  console.log("Storage bucket listing-images is ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
