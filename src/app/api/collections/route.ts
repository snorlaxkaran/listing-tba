import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { rows: true } } },
  });
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
  }
  const collection = await prisma.collection.create({ data: { name } });
  return NextResponse.json(collection, { status: 201 });
}
