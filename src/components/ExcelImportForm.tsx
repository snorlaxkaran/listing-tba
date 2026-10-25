"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sheetInputClass } from "@/components/sheet-styles";

export function ExcelImportForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Choose an Excel file first.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/import/excel", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }
      setMessage(
        `Imported ${data.rowsProcessed} row(s): ${data.createdRows} new SKU(s), ${data.updatedRows} updated, ${data.createdCollections} new collection(s).`,
      );
      input.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        Upload a sheet with columns:{" "}
        <strong>SKU</strong>, <strong>Collection Name</strong>,{" "}
        <strong>Stock Received Qty</strong>. Existing SKUs in the same collection
        update stock only.
      </p>
      <a
        href="/api/import/excel"
        className="inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        Download blank template (.xlsx)
      </a>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          disabled={busy}
          className={`${sheetInputClass} max-w-md text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-zinc-900`}
        />
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import Excel"}
        </button>
      </form>
      {message && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
