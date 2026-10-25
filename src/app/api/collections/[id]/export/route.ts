import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildCollectionWorkbook } from "@/lib/excel";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      rows: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await buildCollectionWorkbook(collection.name, collection.rows);
  const safeName = collection.name.replace(/[^\w\s-]/g, "").trim() || "collection";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}-listing.xlsx"`,
    },
  });
}
