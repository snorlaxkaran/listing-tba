import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildStockImportTemplate,
  parseStockImportWorkbook,
} from "@/lib/excel-import";

export const maxDuration = 60;

export async function GET() {
  const buffer = await buildStockImportTemplate();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="stock-import-template.xlsx"',
    },
  });
}

async function resolveCollectionId(
  name: string,
  cache: Map<string, string>,
): Promise<{ id: string; created: boolean }> {
  const key = name.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return { id: cached, created: false };

  const existing = await prisma.collection.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (existing) {
    cache.set(key, existing.id);
    return { id: existing.id, created: false };
  }

  const created = await prisma.collection.create({
    data: { name: name.trim() },
  });
  cache.set(key, created.id);
  return { id: created.id, created: true };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an Excel file (.xlsx)." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Only .xlsx or .xls files are supported." },
      { status: 400 },
    );
  }

  let rows;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    rows = await parseStockImportWorkbook(buffer);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not read Excel file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const collectionCache = new Map<string, string>();
  let createdCollections = 0;
  let createdRows = 0;
  let updatedRows = 0;
  const touchedCollections = new Set<string>();

  try {
    for (const row of rows) {
      const { id: collectionId, created } = await resolveCollectionId(
        row.collectionName,
        collectionCache,
      );
      if (created) createdCollections += 1;
      touchedCollections.add(collectionId);

      const existingSku = await prisma.skuRow.findFirst({
        where: {
          collectionId,
          sku: { equals: row.sku.trim(), mode: "insensitive" },
        },
      });

      if (existingSku) {
        await prisma.skuRow.update({
          where: { id: existingSku.id },
          data: { factoryStock: row.stockReceivedQty },
        });
        updatedRows += 1;
      } else {
        const count = await prisma.skuRow.count({ where: { collectionId } });
        await prisma.skuRow.create({
          data: {
            collectionId,
            sku: row.sku.trim(),
            factoryStock: row.stockReceivedQty,
            sortOrder: count,
          },
        });
        createdRows += 1;
      }
    }

    const now = new Date();
    for (const collectionId of touchedCollections) {
      await prisma.collection.update({
        where: { id: collectionId },
        data: { updatedAt: now },
      });
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Import failed while saving rows.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    rowsProcessed: rows.length,
    createdCollections,
    createdRows,
    updatedRows,
  });
}
