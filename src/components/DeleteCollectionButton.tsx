"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

type Props = {
  collectionId: string;
  collectionName: string;
  skuCount: number;
  redirectTo?: string;
};

export function DeleteCollectionButton({
  collectionId,
  collectionName,
  skuCount,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const ok = window.confirm(
      `Delete collection "${collectionName}" and all ${skuCount} SKU row(s)? This cannot be undone.`,
    );
    if (!ok) return;

    setPending(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Could not delete collection",
        );
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not delete collection",
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Delete collection ${collectionName}`}
      title="Delete collection"
      className="cursor-pointer rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
