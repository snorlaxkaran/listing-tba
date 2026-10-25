import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAllowedListingImageUrl } from "@/lib/image-url";
import { storeImage } from "@/lib/storage";
import { serializeRow } from "@/lib/sku-row";

type Params = { params: Promise<{ id: string; rowId: string }> };

function validateKind(kind: string) {
  return kind === "whiteBg" || kind === "model";
}

export async function POST(request: Request, { params }: Params) {
  const { id: collectionId, rowId } = await params;
  const row = await prisma.skuRow.findFirst({
    where: { id: rowId, collectionId },
  });
  if (!row) {
    return NextResponse.json({ error: "Row not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const kind = String(body.kind ?? "");
    const publicUrl = String(body.publicUrl ?? "");

    if (!validateKind(kind)) {
      return NextResponse.json({ error: "Invalid image kind" }, { status: 400 });
    }
    if (!publicUrl || !isAllowedListingImageUrl(publicUrl)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }
    if (kind === "whiteBg" && !row.hasWhiteBgImages) {
      return NextResponse.json(
        { error: "Enable white background images for this SKU first" },
        { status: 400 },
      );
    }
    if (kind === "model" && !row.hasModelImages) {
      return NextResponse.json(
        { error: "Enable model images for this SKU first" },
        { status: 400 },
      );
    }

    const updated = await saveImageUrl(rowId, collectionId, kind, publicUrl);
    return NextResponse.json(serializeRow(updated));
  }

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!validateKind(kind)) {
    return NextResponse.json({ error: "Invalid image kind" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }
  if (kind === "whiteBg" && !row.hasWhiteBgImages) {
    return NextResponse.json(
      { error: "Enable white background images for this SKU first" },
      { status: 400 },
    );
  }
  if (kind === "model" && !row.hasModelImages) {
    return NextResponse.json(
      { error: "Enable model images for this SKU first" },
      { status: 400 },
    );
  }

  const key = `${collectionId}/${rowId}/${kind}-${Date.now()}`;
  let url: string;
  try {
    url = await storeImage(file, key);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updated = await saveImageUrl(rowId, collectionId, kind, url);
  return NextResponse.json(serializeRow(updated));
}

async function saveImageUrl(
  rowId: string,
  collectionId: string,
  kind: string,
  url: string,
) {
  const updated = await prisma.skuRow.update({
    where: { id: rowId },
    data:
      kind === "whiteBg"
        ? { whiteBgImageUrl: url }
        : { modelImageUrl: url },
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  return updated;
}
