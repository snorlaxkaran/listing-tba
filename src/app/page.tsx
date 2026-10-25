import { CollectionsList } from "@/components/CollectionsList";
import { ExcelImportForm } from "@/components/ExcelImportForm";
import { NewCollectionForm } from "@/components/NewCollectionForm";
import { SheetDashboard } from "@/components/SheetDashboard";
import { prisma } from "@/lib/db";
import { computeSheetStats } from "@/lib/sheet-stats";

export const instant = false;

export default async function HomePage() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { rows: true } } },
  });

  const allRows = await prisma.skuRow.findMany({
    select: {
      samplesReceived: true,
      factoryStock: true,
      whiteBgWithPhotoshoot: true,
      modelWithPhotoshoot: true,
      isLiveOnWebsite: true,
    },
  });
  const globalStats = computeSheetStats(allRows);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Sample listing tracker
        </h1>
        <p className="mt-2 text-zinc-600">
          Maintain website listing sheets by collection — samples, photoshoot
          handoffs, factory stock, image readiness, and live status.
        </p>
      </div>

      <SheetDashboard stats={globalStats} title="All collections — overview" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-zinc-800">
          Import from Excel
        </h2>
        <ExcelImportForm />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-zinc-800">
          New collection
        </h2>
        <NewCollectionForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-800">Collections</h2>
        <CollectionsList
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            skuCount: c._count.rows,
            updatedAtLabel: c.updatedAt.toLocaleDateString(),
          }))}
        />
      </section>
    </main>
  );
}
