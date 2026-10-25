"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export type CreateCollectionState = { error?: string } | null;

export async function createCollectionAction(
  _prev: CreateCollectionState,
  formData: FormData,
): Promise<CreateCollectionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Enter a collection name first." };
  }

  const collection = await prisma.collection.create({ data: { name } });
  redirect(`/collections/${collection.id}`);
}
