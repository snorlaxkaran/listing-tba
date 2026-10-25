import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSkuRowBody, serializeRow } from "@/lib/sku-row";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: collectionId } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const body = await request.json();
  const input = parseSkuRowBody(body);
  if (!input.sku) {
    return NextResponse.json({ error: "SKU is required" }, { status: 400 });
  }

  const count = await prisma.skuRow.count({ where: { collectionId } });
  const row = await prisma.skuRow.create({
    data: {
      collectionId,
      sortOrder: count,
      ...input,
      notLiveReason: input.isLiveOnWebsite ? null : input.notLiveReason,
    },
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json(serializeRow(row), { status: 201 });
}
