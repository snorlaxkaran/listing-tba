import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  return NextResponse.json(collection);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const collection = await prisma.collection.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(collection);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }
  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
