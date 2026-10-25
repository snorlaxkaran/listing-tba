"use client";

import { sheetInputClass } from "@/components/sheet-styles";
import {
  defaultSheetFilters,
  type SheetFilterState,
  sheetFiltersActive,
  type SkuSort,
  type StockFilter,
  type TriState,
} from "@/lib/sheet-filters";

type Props = {
  filters: SheetFilterState;
  onChange: (next: SheetFilterState) => void;
  visibleCount: number;
  totalCount: number;
};

const triStateOptions: { value: TriState; label: string }[] = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const stockOptions: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inStock", label: "Has qty" },
  { value: "zero", label: "Zero" },
];

const skuSortOptions: { value: SkuSort; label: string }[] = [
  { value: "sheet", label: "Sheet order" },
  { value: "sku-asc", label: "SKU A → Z" },
  { value: "sku-desc", label: "SKU Z → A" },
];

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${sheetInputClass} py-1 text-[12px]`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SheetFiltersBar({
  filters,
  onChange,
  visibleCount,
  totalCount,
}: Props) {
  const active = sheetFiltersActive(filters);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-800">Filter &amp; sort</h2>
        <p className="text-xs text-zinc-500">
          Showing <strong className="text-zinc-800">{visibleCount}</strong> of{" "}
          {totalCount} SKU{totalCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <FilterSelect
          label="SKU sort"
          value={filters.skuSort}
          options={skuSortOptions}
          onChange={(skuSort) => onChange({ ...filters, skuSort })}
        />
        <FilterSelect
          label="Live on site"
          value={filters.live}
          options={triStateOptions}
          onChange={(live) => onChange({ ...filters, live })}
        />
        <FilterSelect
          label="Factory stock"
          value={filters.factoryStock}
          options={stockOptions}
          onChange={(factoryStock) =>
            onChange({ ...filters, factoryStock })
          }
        />
        <FilterSelect
          label="Samples received"
          value={filters.samplesReceived}
          options={stockOptions}
          onChange={(samplesReceived) =>
            onChange({ ...filters, samplesReceived })
          }
        />
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-900">
          White BG &amp; model shoot filters
        </summary>
        <div className="mt-2 grid gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect
            label="White BG — out"
            value={filters.whiteBgWithPhotoshoot}
            options={triStateOptions}
            onChange={(whiteBgWithPhotoshoot) =>
              onChange({ ...filters, whiteBgWithPhotoshoot })
            }
          />
          <FilterSelect
            label="White BG — images"
            value={filters.whiteBgImages}
            options={triStateOptions}
            onChange={(whiteBgImages) =>
              onChange({ ...filters, whiteBgImages })
            }
          />
          <FilterSelect
            label="White BG — returned"
            value={filters.whiteBgPieceReturned}
            options={triStateOptions}
            onChange={(whiteBgPieceReturned) =>
              onChange({ ...filters, whiteBgPieceReturned })
            }
          />
          <FilterSelect
            label="Model — out"
            value={filters.modelWithPhotoshoot}
            options={triStateOptions}
            onChange={(modelWithPhotoshoot) =>
              onChange({ ...filters, modelWithPhotoshoot })
            }
          />
          <FilterSelect
            label="Model — images"
            value={filters.modelImages}
            options={triStateOptions}
            onChange={(modelImages) => onChange({ ...filters, modelImages })}
          />
          <FilterSelect
            label="Model — returned"
            value={filters.modelPieceReturned}
            options={triStateOptions}
            onChange={(modelPieceReturned) =>
              onChange({ ...filters, modelPieceReturned })
            }
          />
        </div>
      </details>

      {active && (
        <button
          type="button"
          onClick={() => onChange(defaultSheetFilters)}
          className="mt-3 cursor-pointer text-xs font-medium text-blue-700 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </section>
  );
}
