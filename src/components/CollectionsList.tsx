"use client";

import Link from "next/link";
import { DeleteCollectionButton } from "@/components/DeleteCollectionButton";

export type CollectionListItem = {
  id: string;
  name: string;
  skuCount: number;
  updatedAtLabel: string;
};

type Props = {
  collections: CollectionListItem[];
};

export function CollectionsList({ collections }: Props) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No sheets yet. Create a collection to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
      {collections.map((c) => (
        <li key={c.id} className="flex items-center gap-1">
          <Link
            href={`/collections/${c.id}`}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
          >
            <span className="truncate font-medium">{c.name}</span>
            <span className="shrink-0 text-sm text-zinc-500">
              {c.skuCount} SKUs · updated {c.updatedAtLabel}
            </span>
          </Link>
          <div className="pr-2">
            <DeleteCollectionButton
              collectionId={c.id}
              collectionName={c.name}
              skuCount={c.skuCount}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
