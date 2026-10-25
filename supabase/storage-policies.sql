-- Run in Supabase → SQL Editor (after creating public bucket "listing-images")

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

create policy "listing_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'listing-images');

create policy "listing_images_anon_upload"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'listing-images');

create policy "listing_images_anon_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'listing-images');
