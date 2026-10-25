import Link from "next/link";
import { NewCollectionForm } from "@/components/NewCollectionForm";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function HomePage() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { rows: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Sample listing tracker
        </h1>
        <p className="mt-2 text-zinc-600">
          Maintain website listing sheets by collection — samples, photoshoot
          handoffs, factory stock, image readiness, and live status. Export to
          Excel with embedded images.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-zinc-800">
          New collection
        </h2>
        <NewCollectionForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-800">Collections</h2>
        {collections.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No sheets yet. Create a collection to get started.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.id}`}
                  className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-zinc-500">
                    {c._count.rows} SKUs · updated{" "}
                    {c.updatedAt.toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
