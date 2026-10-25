# Sample Listing Tracker

Web app for **collection-wise website listing sheets**: track samples received, photoshoot handoffs, factory stock, white-background and model images per SKU, whether stock is live on the website (and why not), upload images when ready, and **download the sheet as Excel** with image previews embedded.

Built with **Next.js** + **Supabase (Postgres)** + deployable on **Vercel**.

## Supabase database setup

1. Create a project at [supabase.com](https://supabase.com) (save the **database password**).
2. In the Supabase dashboard: **Project Settings → Database → Connection string**.
3. Copy two URIs into `.env` (copy from `.env.example` first):

   | Variable | Where in Supabase | Notes |
   |----------|-------------------|--------|
   | `DATABASE_URL` | **Transaction** pooler, port **6543** | Append `?pgbouncer=true&connection_limit=1` if not already there |
   | `DIRECT_URL` | **Session** pooler, port **5432** (or **Direct**) | Prisma migrations use this |

   Replace `[YOUR-PASSWORD]` with your DB password. If the password has special characters, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them.

4. Apply the schema to Supabase:

   ```bash
   npm install
   npx prisma migrate deploy
   ```

   For local development while changing the schema, use `npm run db:migrate` instead.

5. Run the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

### Where data lives

- **There is no `.env` folder** — only a `.env` file in the project root (gitignored).
- **Tables** (`Collection`, `SkuRow`) live in your **Supabase Postgres** project (check **Table Editor** in Supabase).
- **Uploaded images** (without Vercel Blob): `public/uploads/` on your machine only.

## Deploy on Vercel (team use)

1. Import the repo in Vercel.
2. Add the same `DATABASE_URL` and `DIRECT_URL` in **Vercel → Settings → Environment Variables**.
3. **Images:** add [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and set `BLOB_READ_WRITE_TOKEN`, or later wire [Supabase Storage](https://supabase.com/docs/guides/storage).
4. **Team login:** add [Supabase Auth](https://supabase.com/docs/guides/auth) or Clerk when you need access control.

## Excel export

Use **Download Excel** on a collection page. Columns match the grid; when white-background or model flags are on and an image is uploaded, thumbnails are embedded in the workbook.
