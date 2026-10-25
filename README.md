# Sample Listing Tracker

Web app for **collection-wise website listing sheets**: track samples received, photoshoot handoffs, factory stock, white-background and model images per SKU, whether stock is live on the website (and why not), upload images when ready, and **download the sheet as Excel** with image previews embedded.

Built with **Next.js** (Vercel-friendly).

## Run locally

```bash
npm install
cp .env.example .env   # or copy on Windows
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel (team use)

1. Push this repo to GitHub and import the project in Vercel.
2. **Database:** SQLite works on your machine only. For production, use [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres):
   - Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.
   - Set `DATABASE_URL` in Vercel environment variables.
   - Run migrations against production once (`npx prisma migrate deploy`).
3. **Images:** Add a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store and set `BLOB_READ_WRITE_TOKEN` in Vercel. Without it, uploads use `public/uploads` (fine locally, not durable on serverless).
4. **Team login:** Not included yet — add [Clerk](https://clerk.com) or Auth.js when you are ready to restrict access.

## Excel export

Use **Download Excel** on a collection page. Columns match the grid; when white-background or model flags are on and an image is uploaded, thumbnails are embedded in the workbook.
