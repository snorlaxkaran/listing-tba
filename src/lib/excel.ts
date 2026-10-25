import ExcelJS from "exceljs";
import { readFile } from "fs/promises";
import path from "path";
import type { SkuRow } from "@prisma/client";

const IMAGE_ROW_HEIGHT = 80;
const IMAGE_COL_WIDTH = 18;

async function imageBufferFromUrl(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", url);
      return await readFile(filePath);
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function buildCollectionWorkbook(
  collectionName: string,
  rows: SkuRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sample Listing Tracker";
  const sheet = workbook.addWorksheet(collectionName.slice(0, 31));

  sheet.columns = [
    { header: "SKU", key: "sku", width: 18 },
    { header: "Samples received", key: "samplesReceived", width: 16 },
    {
      header: "Pcs given — white BG shoot",
      key: "givenForWhiteBgShoot",
      width: 22,
    },
    {
      header: "Pcs given — model shoot",
      key: "givenForModelShoot",
      width: 22,
    },
    { header: "Factory stock", key: "factoryStock", width: 14 },
    { header: "White BG image received", key: "hasWhiteBgImages", width: 18 },
    { header: "White BG preview", key: "whiteBgPreview", width: IMAGE_COL_WIDTH },
    { header: "Model image received", key: "hasModelImages", width: 18 },
    { header: "Model preview", key: "modelPreview", width: IMAGE_COL_WIDTH },
    { header: "Live on website", key: "isLiveOnWebsite", width: 16 },
    { header: "Not live reason", key: "notLiveReason", width: 28 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", wrapText: true };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const excelRowIndex = i + 2;
    sheet.addRow({
      sku: row.sku,
      samplesReceived: row.samplesReceived,
      givenForWhiteBgShoot: row.givenForWhiteBgShoot,
      givenForModelShoot: row.givenForModelShoot,
      factoryStock: row.factoryStock,
      hasWhiteBgImages: row.hasWhiteBgImages ? "Yes" : "No",
      hasModelImages: row.hasModelImages ? "Yes" : "No",
      isLiveOnWebsite: row.isLiveOnWebsite ? "Yes" : "No",
      notLiveReason: row.isLiveOnWebsite ? "" : row.notLiveReason ?? "",
    });

    sheet.getRow(excelRowIndex).height = IMAGE_ROW_HEIGHT;

    if (row.hasWhiteBgImages && row.whiteBgImageUrl) {
      const buf = await imageBufferFromUrl(row.whiteBgImageUrl);
      if (buf) {
        const imageId = workbook.addImage({
          buffer: buf as unknown as ExcelJS.Buffer,
          extension: "jpeg",
        });
        sheet.addImage(imageId, {
          tl: { col: 6, row: excelRowIndex - 1 },
          ext: { width: 110, height: 95 },
        });
      }
    }

    if (row.hasModelImages && row.modelImageUrl) {
      const buf = await imageBufferFromUrl(row.modelImageUrl);
      if (buf) {
        const imageId = workbook.addImage({
          buffer: buf as unknown as ExcelJS.Buffer,
          extension: "jpeg",
        });
        sheet.addImage(imageId, {
          tl: { col: 8, row: excelRowIndex - 1 },
          ext: { width: 110, height: 95 },
        });
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
