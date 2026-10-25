export type RowStatsInput = {
  samplesReceived: number;
  factoryStock: number;
  whiteBgWithPhotoshoot: boolean;
  modelWithPhotoshoot: boolean;
  isLiveOnWebsite: boolean;
};

export type SheetStats = {
  skuCount: number;
  samplesReceived: number;
  factoryStock: number;
  piecesWithPhotoshoot: number;
  skusWithPhotoshoot: number;
  skusLive: number;
};

export function computeSheetStats(rows: RowStatsInput[]): SheetStats {
  let piecesWithPhotoshoot = 0;
  let skusWithPhotoshoot = 0;
  let skusLive = 0;
  let samplesReceived = 0;
  let factoryStock = 0;

  for (const r of rows) {
    samplesReceived += r.samplesReceived;
    factoryStock += r.factoryStock;
    const wb = r.whiteBgWithPhotoshoot;
    const md = r.modelWithPhotoshoot;
    if (wb) piecesWithPhotoshoot += 1;
    if (md) piecesWithPhotoshoot += 1;
    if (wb || md) skusWithPhotoshoot += 1;
    if (r.isLiveOnWebsite) skusLive += 1;
  }

  return {
    skuCount: rows.length,
    samplesReceived,
    factoryStock,
    piecesWithPhotoshoot,
    skusWithPhotoshoot,
    skusLive,
  };
}
