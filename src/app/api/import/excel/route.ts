import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildStockImportTemplate,
  parseStockImportWorkbook,
} from "@/lib/excel-import";

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

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const collectionKey = row.collectionName.toLowerCase();
      let collectionId = collectionCache.get(collectionKey);

      if (!collectionId) {
        const existing = await tx.collection.findFirst({
          where: {
            name: { equals: row.collectionName, mode: "insensitive" },
          },
        });
        if (existing) {
          collectionId = existing.id;
        } else {
          const created = await tx.collection.create({
            data: { name: row.collectionName.trim() },
          });
          collectionId = created.id;
          createdCollections += 1;
        }
        collectionCache.set(collectionKey, collectionId);
      }

      const existingSku = await tx.skuRow.findFirst({
        where: {
          collectionId,
          sku: { equals: row.sku, mode: "insensitive" },
        },
      });

      if (existingSku) {
        await tx.skuRow.update({
          where: { id: existingSku.id },
          data: { factoryStock: row.stockReceivedQty },
        });
        updatedRows += 1;
      } else {
        const count = await tx.skuRow.count({ where: { collectionId } });
        await tx.skuRow.create({
          data: {
            collectionId,
            sku: row.sku.trim(),
            factoryStock: row.stockReceivedQty,
            sortOrder: count,
          },
        });
        createdRows += 1;
      }

      await tx.collection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    rowsProcessed: rows.length,
    createdCollections,
    createdRows,
    updatedRows,
  });
}
