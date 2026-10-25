import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSkuRowBody, serializeRow } from "@/lib/sku-row";

type Params = { params: Promise<{ id: string; rowId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id: collectionId, rowId } = await params;
  const existing = await prisma.skuRow.findFirst({
    where: { id: rowId, collectionId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Row not found" }, { status: 404 });
  }

  const body = await request.json();
  const input = parseSkuRowBody({ ...existing, ...body });
  if (!input.sku) {
    return NextResponse.json({ error: "SKU is required" }, { status: 400 });
  }

  const row = await prisma.skuRow.update({
    where: { id: rowId },
    data: {
      ...input,
      notLiveReason: input.isLiveOnWebsite ? null : input.notLiveReason,
      whiteBgImageUrl: input.hasWhiteBgImages ? existing.whiteBgImageUrl : null,
      modelImageUrl: input.hasModelImages ? existing.modelImageUrl : null,
    },
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json(serializeRow(row));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: collectionId, rowId } = await params;
  const existing = await prisma.skuRow.findFirst({
    where: { id: rowId, collectionId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Row not found" }, { status: 404 });
  }
  await prisma.skuRow.delete({ where: { id: rowId } });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
