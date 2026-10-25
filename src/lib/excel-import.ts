import ExcelJS from "exceljs";

export type ExcelImportRow = {
  sku: string;
  collectionName: string;
  stockReceivedQty: number;
};

const SKU_HEADERS = new Set(["sku"]);
const COLLECTION_HEADERS = new Set(["collection name", "collection"]);
const STOCK_HEADERS = new Set([
  "stock received qty",
  "stock received",
  "stock qty",
  "stock",
]);

function normHeader(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: string }).text).trim();
  }
  return String(value).trim();
}

function cellQty(value: ExcelJS.CellValue): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export async function parseStockImportWorkbook(
  buffer: Buffer,
): Promise<ExcelImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("The file has no worksheets.");
  }

  const headerRow = sheet.getRow(1);
  let skuCol = 0;
  let collectionCol = 0;
  let stockCol = 0;

  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const h = normHeader(cell.value);
    if (SKU_HEADERS.has(h)) skuCol = col;
    if (COLLECTION_HEADERS.has(h)) collectionCol = col;
    if (STOCK_HEADERS.has(h)) stockCol = col;
  });

  if (!skuCol || !collectionCol || !stockCol) {
    throw new Error(
      'First row must include headers: "SKU", "Collection Name", "Stock Received Qty".',
    );
  }

  const rows: ExcelImportRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const sku = cellText(row.getCell(skuCol).value);
    const collectionName = cellText(row.getCell(collectionCol).value);
    const stockReceivedQty = cellQty(row.getCell(stockCol).value);

    if (!sku && !collectionName) continue;
    if (!sku || !collectionName) {
      throw new Error(`Row ${r}: SKU and Collection Name are required.`);
    }

    rows.push({ sku, collectionName, stockReceivedQty });
  }

  if (rows.length === 0) {
    throw new Error("No data rows found below the header.");
  }

  return rows;
}

export async function buildStockImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Import");
  sheet.addRow(["SKU", "Collection Name", "Stock Received Qty"]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [{ width: 18 }, { width: 24 }, { width: 20 }];
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
