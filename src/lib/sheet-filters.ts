import type { SheetRow } from "@/lib/sku-row";

export type TriState = "all" | "yes" | "no";
export type StockFilter = "all" | "inStock" | "zero";
export type SkuSort = "sheet" | "sku-asc" | "sku-desc";

export type SheetFilterState = {
  skuSort: SkuSort;
  live: TriState;
  factoryStock: StockFilter;
  samplesReceived: StockFilter;
  whiteBgWithPhotoshoot: TriState;
  whiteBgImages: TriState;
  whiteBgPieceReturned: TriState;
  modelWithPhotoshoot: TriState;
  modelImages: TriState;
  modelPieceReturned: TriState;
};

export const defaultSheetFilters: SheetFilterState = {
  skuSort: "sheet",
  live: "all",
  factoryStock: "all",
  samplesReceived: "all",
  whiteBgWithPhotoshoot: "all",
  whiteBgImages: "all",
  whiteBgPieceReturned: "all",
  modelWithPhotoshoot: "all",
  modelImages: "all",
  modelPieceReturned: "all",
};

function triStateMatch(value: boolean, filter: TriState): boolean {
  if (filter === "all") return true;
  return filter === "yes" ? value : !value;
}

function stockMatch(value: number, filter: StockFilter): boolean {
  if (filter === "all") return true;
  if (filter === "inStock") return value > 0;
  return value === 0;
}

export function sheetFiltersActive(f: SheetFilterState): boolean {
  return (
    f.skuSort !== "sheet" ||
    f.live !== "all" ||
    f.factoryStock !== "all" ||
    f.samplesReceived !== "all" ||
    f.whiteBgWithPhotoshoot !== "all" ||
    f.whiteBgImages !== "all" ||
    f.whiteBgPieceReturned !== "all" ||
    f.modelWithPhotoshoot !== "all" ||
    f.modelImages !== "all" ||
    f.modelPieceReturned !== "all"
  );
}

export function applySheetFilters(
  rows: SheetRow[],
  filters: SheetFilterState,
): SheetRow[] {
  const filtered = rows.filter(
    (row) =>
      triStateMatch(row.isLiveOnWebsite, filters.live) &&
      stockMatch(row.factoryStock, filters.factoryStock) &&
      stockMatch(row.samplesReceived, filters.samplesReceived) &&
      triStateMatch(row.whiteBgWithPhotoshoot, filters.whiteBgWithPhotoshoot) &&
      triStateMatch(row.hasWhiteBgImages, filters.whiteBgImages) &&
      triStateMatch(row.whiteBgPieceReturned, filters.whiteBgPieceReturned) &&
      triStateMatch(row.modelWithPhotoshoot, filters.modelWithPhotoshoot) &&
      triStateMatch(row.hasModelImages, filters.modelImages) &&
      triStateMatch(row.modelPieceReturned, filters.modelPieceReturned),
  );

  if (filters.skuSort === "sheet") return filtered;

  const sorted = [...filtered];
  const cmp = (a: SheetRow, b: SheetRow) =>
    a.sku.localeCompare(b.sku, undefined, { sensitivity: "base" });
  sorted.sort(filters.skuSort === "sku-asc" ? cmp : (a, b) => cmp(b, a));
  return sorted;
}
