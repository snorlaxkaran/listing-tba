import { NextResponse } from "next/server";
import {
  buildStockImportTemplate,
  parseStockImportWorkbook,
} from "@/lib/excel-import";
import { applyStockImport } from "@/lib/stock-import-db";

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

  try {
    const result = await applyStockImport(rows);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Import failed while saving rows.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
