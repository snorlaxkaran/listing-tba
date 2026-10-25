import type { SkuRow } from "@prisma/client";

export type SkuRowInput = {
  sku: string;
  samplesReceived: number;
  givenForWhiteBgShoot: number;
  givenForModelShoot: number;
  factoryStock: number;
  hasWhiteBgImages: boolean;
  hasModelImages: boolean;
  isLiveOnWebsite: boolean;
  notLiveReason: string | null;
};

export function parseSkuRowBody(body: Record<string, unknown>): SkuRowInput {
  return {
    sku: String(body.sku ?? "").trim(),
    samplesReceived: clampInt(body.samplesReceived, 0),
    givenForWhiteBgShoot: clampInt(body.givenForWhiteBgShoot, 0),
    givenForModelShoot: clampInt(body.givenForModelShoot, 0),
    factoryStock: clampInt(body.factoryStock, 0),
    hasWhiteBgImages: Boolean(body.hasWhiteBgImages),
    hasModelImages: Boolean(body.hasModelImages),
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

export function serializeRow(row: SkuRow) {
  return {
    id: row.id,
    sku: row.sku,
    samplesReceived: row.samplesReceived,
    givenForWhiteBgShoot: row.givenForWhiteBgShoot,
    givenForModelShoot: row.givenForModelShoot,
    factoryStock: row.factoryStock,
    hasWhiteBgImages: row.hasWhiteBgImages,
    whiteBgImageUrl: row.whiteBgImageUrl,
    hasModelImages: row.hasModelImages,
    modelImageUrl: row.modelImageUrl,
    isLiveOnWebsite: row.isLiveOnWebsite,
    notLiveReason: row.notLiveReason,
  };
}
