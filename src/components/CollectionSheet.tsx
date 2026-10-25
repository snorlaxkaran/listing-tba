"use client";

import { useCallback, useState } from "react";

export type SheetRow = {
  id: string;
  sku: string;
  samplesReceived: number;
  givenToPhotoshoot: number;
  factoryStock: number;
  hasWhiteBgImages: boolean;
  whiteBgImageUrl: string | null;
  hasModelImages: boolean;
  modelImageUrl: string | null;
  isLiveOnWebsite: boolean;
  notLiveReason: string | null;
};

type Props = {
  collectionId: string;
  collectionName: string;
  initialRows: SheetRow[];
};

export function CollectionSheet({
  collectionId,
  collectionName,
  initialRows,
}: Props) {
  const [rows, setRows] = useState<SheetRow[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchRow = useCallback(
    async (rowId: string, patch: Partial<SheetRow>) => {
      setError(null);
      const res = await fetch(
        `/api/collections/${collectionId}/rows/${rowId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save row");
      }
      const updated = (await res.json()) as SheetRow;
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
      return updated;
    },
    [collectionId],
  );

  async function addRow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/collections/${collectionId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "NEW-SKU" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not add row");
      }
      const row = (await res.json()) as SheetRow;
      setRows((prev) => [...prev, row]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add row");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!confirm("Remove this SKU row?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/rows/${rowId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Could not delete row");
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete row");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(
    rowId: string,
    kind: "whiteBg" | "model",
    file: File,
  ) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const res = await fetch(
        `/api/collections/${collectionId}/rows/${rowId}/upload`,
        { method: "POST", body: form },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const updated = (await res.json()) as SheetRow;
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadExcel() {
    window.location.href = `/api/collections/${collectionId}/export`;
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.samples += r.samplesReceived;
      acc.photoshoot += r.givenToPhotoshoot;
      acc.stock += r.factoryStock;
      return acc;
    },
    { samples: 0, photoshoot: 0, stock: 0 },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Collection sheet</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {collectionName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {rows.length} SKUs · {totals.samples} samples received ·{" "}
            {totals.photoshoot} with photoshoot · {totals.stock} factory stock
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add SKU row
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Download Excel
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3">Samples</th>
              <th className="px-3 py-3">Photoshoot</th>
              <th className="px-3 py-3">Factory stock</th>
              <th className="px-3 py-3">White BG</th>
              <th className="px-3 py-3">Model</th>
              <th className="px-3 py-3">Live</th>
              <th className="px-3 py-3">Not live reason</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <SheetRowEditor
                key={row.id}
                row={row}
                busy={busy}
                onPatch={patchRow}
                onUpload={uploadImage}
                onRemove={() => removeRow(row.id)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center text-zinc-500"
                >
                  No SKUs yet. Add a row to start tracking this collection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SheetRowEditor({
  row,
  busy,
  onPatch,
  onUpload,
  onRemove,
}: {
  row: SheetRow;
  busy: boolean;
  onPatch: (id: string, patch: Partial<SheetRow>) => Promise<SheetRow>;
  onUpload: (id: string, kind: "whiteBg" | "model", file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(row);

  async function commit(patch: Partial<SheetRow>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    try {
      const saved = await onPatch(row.id, patch);
      setDraft(saved);
    } catch {
      setDraft(row);
    }
  }

  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <input
          className="w-36 rounded border border-zinc-200 px-2 py-1"
          value={draft.sku}
          onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
          onBlur={() => {
            if (draft.sku !== row.sku) commit({ sku: draft.sku });
          }}
        />
      </td>
      <td className="px-3 py-2">
        <NumInput
          value={draft.samplesReceived}
          onCommit={(v) => commit({ samplesReceived: v })}
        />
      </td>
      <td className="px-3 py-2">
        <NumInput
          value={draft.givenToPhotoshoot}
          onCommit={(v) => commit({ givenToPhotoshoot: v })}
        />
      </td>
      <td className="px-3 py-2">
        <NumInput
          value={draft.factoryStock}
          onCommit={(v) => commit({ factoryStock: v })}
        />
      </td>
      <td className="px-3 py-2">
        <Toggle
          checked={draft.hasWhiteBgImages}
          onChange={(v) => commit({ hasWhiteBgImages: v })}
        />
        {draft.hasWhiteBgImages && (
          <ImageCell
            url={draft.whiteBgImageUrl}
            disabled={busy}
            onFile={(f) => onUpload(row.id, "whiteBg", f)}
          />
        )}
      </td>
      <td className="px-3 py-2">
        <Toggle
          checked={draft.hasModelImages}
          onChange={(v) => commit({ hasModelImages: v })}
        />
        {draft.hasModelImages && (
          <ImageCell
            url={draft.modelImageUrl}
            disabled={busy}
            onFile={(f) => onUpload(row.id, "model", f)}
          />
        )}
      </td>
      <td className="px-3 py-2">
        <Toggle
          checked={draft.isLiveOnWebsite}
          onChange={(v) =>
            commit({
              isLiveOnWebsite: v,
              notLiveReason: v ? null : draft.notLiveReason,
            })
          }
        />
      </td>
      <td className="px-3 py-2">
        {!draft.isLiveOnWebsite ? (
          <input
            className="w-48 rounded border border-zinc-200 px-2 py-1"
            placeholder="Why not live?"
            value={draft.notLiveReason ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, notLiveReason: e.target.value })
            }
            onBlur={() => {
              if (draft.notLiveReason !== row.notLiveReason) {
                commit({ notLiveReason: draft.notLiveReason });
              }
            }}
          />
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function NumInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  return (
    <input
      type="number"
      min={0}
      className="w-20 rounded border border-zinc-200 px-2 py-1"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.floor(Number(local) || 0));
        setLocal(String(n));
        if (n !== value) onCommit(n);
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-emerald-600" : "bg-zinc-300"
      }`}
    >
      <span
        className={`mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ImageCell({
  url,
  disabled,
  onFile,
}: {
  url: string | null;
  disabled: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div className="mt-2 space-y-1">
      {url && (
        <img
          src={url}
          alt=""
          className="h-14 w-14 rounded border border-zinc-200 object-cover"
        />
      )}
      <label className="block cursor-pointer text-xs text-blue-600 hover:underline">
        {url ? "Replace image" : "Upload image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
