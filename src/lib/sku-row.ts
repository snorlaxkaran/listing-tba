import type { SkuRow } from "@prisma/client";

export type SkuRowInput = {
  sku: string;
  samplesReceived: number;
  factoryStock: number;
  whiteBgWithPhotoshoot: boolean;
  whiteBgPieceReturned: boolean;
  modelWithPhotoshoot: boolean;
  modelPieceReturned: boolean;
  hasWhiteBgImages: boolean;
  hasModelImages: boolean;
  isLiveOnWebsite: boolean;
  notLiveReason: string | null;
};

export function parseSkuRowBody(body: Record<string, unknown>): SkuRowInput {
  const hasWhiteBgImages = Boolean(body.hasWhiteBgImages);
  const hasModelImages = Boolean(body.hasModelImages);

  let whiteBgWithPhotoshoot = Boolean(body.whiteBgWithPhotoshoot);
  let whiteBgPieceReturned = Boolean(body.whiteBgPieceReturned);
  let modelWithPhotoshoot = Boolean(body.modelWithPhotoshoot);
  let modelPieceReturned = Boolean(body.modelPieceReturned);

  if (whiteBgPieceReturned) {
    whiteBgWithPhotoshoot = false;
  }
  if (modelPieceReturned) {
    modelWithPhotoshoot = false;
  }
  if (whiteBgWithPhotoshoot) {
    whiteBgPieceReturned = false;
  }
  if (modelWithPhotoshoot) {
    modelPieceReturned = false;
  }
  if (!hasWhiteBgImages) {
    whiteBgPieceReturned = false;
  }
  if (!hasModelImages) {
    modelPieceReturned = false;
  }

  return {
    sku: String(body.sku ?? "").trim(),
    samplesReceived: clampInt(body.samplesReceived, 0),
    factoryStock: clampInt(body.factoryStock, 0),
    whiteBgWithPhotoshoot,
    whiteBgPieceReturned,
    modelWithPhotoshoot,
    modelPieceReturned,
    hasWhiteBgImages,
    hasModelImages,
    isLiveOnWebsite: Boolean(body.isLiveOnWebsite),
    notLiveReason:
      body.notLiveReason === null || body.notLiveReason === undefined
        ? null
        : String(body.notLiveReason).trim() || null,
  };
}

function clampInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export type SheetRow = {
  id: string;
  sku: string;
  samplesReceived: number;
  factoryStock: number;
  whiteBgWithPhotoshoot: boolean;
  whiteBgPieceReturned: boolean;
  modelWithPhotoshoot: boolean;
  modelPieceReturned: boolean;
  hasWhiteBgImages: boolean;
  whiteBgImageUrl: string | null;
  hasModelImages: boolean;
  modelImageUrl: string | null;
  isLiveOnWebsite: boolean;
  notLiveReason: string | null;
};

export function serializeRow(row: SkuRow): SheetRow {
  return {
    id: row.id,
    sku: row.sku,
    samplesReceived: row.samplesReceived,
    factoryStock: row.factoryStock,
    whiteBgWithPhotoshoot: row.whiteBgWithPhotoshoot,
    whiteBgPieceReturned: row.whiteBgPieceReturned,
    modelWithPhotoshoot: row.modelWithPhotoshoot,
    modelPieceReturned: row.modelPieceReturned,
    hasWhiteBgImages: row.hasWhiteBgImages,
    whiteBgImageUrl: row.whiteBgImageUrl,
    hasModelImages: row.hasModelImages,
    modelImageUrl: row.modelImageUrl,
    isLiveOnWebsite: row.isLiveOnWebsite,
    notLiveReason: row.notLiveReason,
  };
}
