import { readFile } from "fs/promises";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const path = process.argv[2];
const buf = await readFile(path);
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buf);
const sheet = workbook.worksheets[0];
const rows = [];
const lastRow = Math.max(sheet.rowCount, sheet.actualRowCount ?? 0);
for (let r = 2; r <= lastRow; r++) {
  const row = sheet.getRow(r);
  const sku = String(row.getCell(1).value ?? "").trim();
  const collectionName = String(row.getCell(2).value ?? "").trim();
  const stock = Math.floor(Number(row.getCell(3).value) || 0);
  if (!sku && !collectionName && stock === 0) continue;
  rows.push({ sku, collectionName, stockReceivedQty: stock });
}
console.log("rows", rows.length);

const prisma = new PrismaClient();
const cache = new Map();

async function resolveCollectionId(name) {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const existing = await prisma.collection.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });
  const id =
    existing?.id ??
    (await prisma.collection.create({ data: { name: name.trim() } })).id;
  cache.set(key, id);
  return id;
}

try {
  for (const row of rows) {
    const collectionId = await resolveCollectionId(row.collectionName);
    const existingSku = await prisma.skuRow.findFirst({
      where: {
        collectionId,
        sku: { equals: row.sku, mode: "insensitive" },
      },
    });
    if (existingSku) {
      await prisma.skuRow.update({
        where: { id: existingSku.id },
        data: { factoryStock: row.stockReceivedQty },
      });
    } else {
      const count = await prisma.skuRow.count({ where: { collectionId } });
      await prisma.skuRow.create({
        data: {
          collectionId,
          sku: row.sku,
          factoryStock: row.stockReceivedQty,
          sortOrder: count,
        },
      });
    }
  }
  console.log("import OK");
} catch (e) {
  console.error("import FAIL", e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
