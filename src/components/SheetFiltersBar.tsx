"use client";

import { useEffect, useState } from "react";
import { sheetInputClass } from "@/components/sheet-styles";
import {
  defaultSheetFilters,
  type QuickFilter,
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
  const [skuDraft, setSkuDraft] = useState(filters.skuSearch);

  useEffect(() => {
    setSkuDraft(filters.skuSearch);
  }, [filters.skuSearch]);

  function toggleQuickFilter(key: QuickFilter) {
    onChange({
      ...filters,
      quickFilter: filters.quickFilter === key ? "none" : key,
    });
  }

  function applySkuSearch() {
    onChange({ ...filters, skuSearch: skuDraft.trim() });
  }

  const quickBtnClass = (key: QuickFilter) =>
    `cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
      filters.quickFilter === key
        ? "border-amber-500 bg-amber-50 text-amber-950"
        : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
    }`;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-800">Filter &amp; sort</h2>
        <p className="text-xs text-zinc-500">
          Showing <strong className="text-zinc-800">{visibleCount}</strong> of{" "}
          {totalCount} SKU{totalCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Search SKU
          </span>
          <input
            type="search"
            value={skuDraft}
            placeholder="e.g. TSNP0013"
            className={`${sheetInputClass} font-mono py-1 text-[12px]`}
            onChange={(e) => setSkuDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySkuSearch();
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={applySkuSearch}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 sm:shrink-0"
        >
          Search
        </button>
        {filters.skuSearch && (
          <button
            type="button"
            onClick={() => {
              setSkuDraft("");
              onChange({ ...filters, skuSearch: "" });
            }}
            className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-900 sm:pb-2"
          >
            Clear search
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={quickBtnClass("stockNoSamples")}
          onClick={() => toggleQuickFilter("stockNoSamples")}
          title="Factory stock &gt; 0 but samples received is 0"
        >
          Stock but no samples
        </button>
        <button
          type="button"
          className={quickBtnClass("liveNoWhiteBg")}
          onClick={() => toggleQuickFilter("liveNoWhiteBg")}
          title="Live on website but white BG images not marked received"
        >
          Live but no white BG images
        </button>
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
