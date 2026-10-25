import type { SheetStats } from "@/lib/sheet-stats";

type Props = {
  stats: SheetStats;
  title?: string;
};

export function SheetDashboard({ stats, title = "Dashboard" }: Props) {
  const cards = [
    {
      label: "Samples received",
      value: stats.samplesReceived,
      hint: "Total pieces received (all SKUs)",
    },
    {
      label: "Factory stock",
      value: stats.factoryStock,
      hint: "Stock on hand from factory",
    },
    {
      label: "With photoshoot team",
      value: stats.piecesWithPhotoshoot,
      hint: `${stats.skusWithPhotoshoot} SKU(s) · 1 pc per shoot type when out`,
    },
    {
      label: "SKUs live on site",
      value: stats.skusLive,
      hint: `of ${stats.skuCount} SKU rows`,
    },
  ];

  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5"
          >
            <p className="text-[11px] font-medium text-zinc-600">{c.label}</p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900">
              {c.value}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">{c.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
