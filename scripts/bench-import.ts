import { readFile } from "fs/promises";
import ExcelJS from "exceljs";
import { applyStockImport } from "../src/lib/stock-import-db";
import { prisma } from "../src/lib/db";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/bench-import.ts <file.xlsx>");
    process.exit(1);
  }

  const buf = Buffer.from(await readFile(path));
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

  const t0 = Date.now();
  try {
    const result = await applyStockImport(rows);
    console.log("import OK", result, `${Date.now() - t0}ms`);
  } catch (e) {
    console.error("import FAIL", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
