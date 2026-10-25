import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionSheet } from "@/components/CollectionSheet";
import { prisma } from "@/lib/db";
import { serializeRow } from "@/lib/sku-row";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      rows: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!collection) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-8">
      <Link
        href="/"
        className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
      >
        ← All collections
      </Link>
      <CollectionSheet
        collectionId={collection.id}
        collectionName={collection.name}
        initialRows={collection.rows.map(serializeRow)}
      />
    </main>
  );
}
