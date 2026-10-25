"use client";

import { useActionState } from "react";
import {
  createCollectionAction,
  type CreateCollectionState,
} from "@/app/actions/collections";
import { sheetInputClass } from "@/components/sheet-styles";

export function NewCollectionForm() {
  const [state, formAction, pending] = useActionState<
    CreateCollectionState,
    FormData
  >(createCollectionAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        type="text"
        name="name"
        placeholder="New collection name (e.g. Summer 2026)"
        className={`${sheetInputClass} min-w-0 flex-1 rounded-lg py-2`}
        required
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create sheet"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>
      )}
    </form>
  );
}
