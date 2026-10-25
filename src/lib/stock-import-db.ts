import { Prisma } from "@prisma/client";
import type { ExcelImportRow } from "@/lib/excel-import";
import { prisma } from "@/lib/db";

export type StockImportResult = {
  rowsProcessed: number;
  createdCollections: number;
  createdRows: number;
  updatedRows: number;
};

const CREATE_BATCH = 200;
const UPDATE_BATCH = 80;

function skuKey(collectionId: string, sku: string) {
  return `${collectionId}\0${sku.trim().toLowerCase()}`;
}

/** Last row wins when the same collection + SKU appears more than once. */
function dedupeRows(rows: ExcelImportRow[]): ExcelImportRow[] {
  const byKey = new Map<string, ExcelImportRow>();
  for (const row of rows) {
    const collectionName = row.collectionName.trim();
    const sku = row.sku.trim();
    byKey.set(`${collectionName.toLowerCase()}\0${sku.toLowerCase()}`, {
      sku,
      collectionName,
      stockReceivedQty: row.stockReceivedQty,
    });
  }
  return [...byKey.values()];
}

async function ensureCollections(
  rows: ExcelImportRow[],
): Promise<{ byLowerName: Map<string, { id: string; name: string }>; created: number }> {
  const existing = await prisma.collection.findMany({
    select: { id: true, name: true },
  });
  const byLowerName = new Map(
    existing.map((c) => [c.name.toLowerCase(), c]),
  );

  const neededNames = new Map<string, string>();
  for (const row of rows) {
    const name = row.collectionName.trim();
    neededNames.set(name.toLowerCase(), name);
  }

  const missing: { name: string }[] = [];
  for (const [lower, name] of neededNames) {
    if (!byLowerName.has(lower)) missing.push({ name });
  }

  let created = 0;
  if (missing.length > 0) {
    const result = await prisma.collection.createMany({ data: missing });
    created = result.count;
    const refreshed = await prisma.collection.findMany({
      select: { id: true, name: true },
    });
    byLowerName.clear();
    for (const c of refreshed) {
      byLowerName.set(c.name.toLowerCase(), c);
    }
  }

  return { byLowerName, created };
}

async function bulkUpdateFactoryStock(
  updates: { id: string; factoryStock: number }[],
) {
  for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
    const chunk = updates.slice(i, i + UPDATE_BATCH);
    const tuples = Prisma.join(
      chunk.map(
        (u) => Prisma.sql`(${u.id}::text, ${u.factoryStock}::int)`,
      ),
    );
    await prisma.$executeRaw`
      UPDATE "SkuRow" AS s
      SET "factoryStock" = v.stock, "updatedAt" = NOW()
      FROM (VALUES ${tuples}) AS v(id, stock)
      WHERE s.id = v.id
    `;
  }
}

export async function applyStockImport(
  rows: ExcelImportRow[],
): Promise<StockImportResult> {
  const deduped = dedupeRows(rows);
  if (deduped.length === 0) {
    return {
      rowsProcessed: 0,
      createdCollections: 0,
      createdRows: 0,
      updatedRows: 0,
    };
  }

  const { byLowerName, created: createdCollections } =
    await ensureCollections(deduped);

  const collectionIds = new Set<string>();
  for (const row of deduped) {
    const col = byLowerName.get(row.collectionName.toLowerCase());
    if (!col) {
      throw new Error(`Collection not found after create: ${row.collectionName}`);
    }
    collectionIds.add(col.id);
  }

  const existingRows = await prisma.skuRow.findMany({
    where: { collectionId: { in: [...collectionIds] } },
    select: { id: true, collectionId: true, sku: true, sortOrder: true },
  });

  const existingByKey = new Map<string, { id: string }>();
  const nextSortOrder = new Map<string, number>();
  for (const id of collectionIds) {
    nextSortOrder.set(id, 0);
  }
  for (const r of existingRows) {
    existingByKey.set(skuKey(r.collectionId, r.sku), { id: r.id });
    const next = (nextSortOrder.get(r.collectionId) ?? 0);
    nextSortOrder.set(r.collectionId, Math.max(next, r.sortOrder + 1));
  }

  const toCreate: {
    collectionId: string;
    sku: string;
    factoryStock: number;
    sortOrder: number;
  }[] = [];
  const toUpdate: { id: string; factoryStock: number }[] = [];

  for (const row of deduped) {
    const col = byLowerName.get(row.collectionName.toLowerCase())!;
    const key = skuKey(col.id, row.sku);
    const existing = existingByKey.get(key);
    if (existing) {
      toUpdate.push({ id: existing.id, factoryStock: row.stockReceivedQty });
    } else {
      const sortOrder = nextSortOrder.get(col.id) ?? 0;
      nextSortOrder.set(col.id, sortOrder + 1);
      toCreate.push({
        collectionId: col.id,
        sku: row.sku,
        factoryStock: row.stockReceivedQty,
        sortOrder,
      });
      existingByKey.set(key, { id: `pending-${key}` });
    }
  }

  for (let i = 0; i < toCreate.length; i += CREATE_BATCH) {
    await prisma.skuRow.createMany({
      data: toCreate.slice(i, i + CREATE_BATCH),
    });
  }

  if (toUpdate.length > 0) {
    await bulkUpdateFactoryStock(toUpdate);
  }

  const now = new Date();
  await prisma.collection.updateMany({
    where: { id: { in: [...collectionIds] } },
    data: { updatedAt: now },
  });

  return {
    rowsProcessed: deduped.length,
    createdCollections,
    createdRows: toCreate.length,
    updatedRows: toUpdate.length,
  };
}
