"use client";

import { useCallback, useEffect, useState } from "react";
import { DeleteCollectionButton } from "@/components/DeleteCollectionButton";
import { ImageDropzone } from "@/components/ImageDropzone";
import { SheetDashboard } from "@/components/SheetDashboard";
import { sheetInputClass, sheetTableClass } from "@/components/sheet-styles";
import { computeSheetStats } from "@/lib/sheet-stats";
import { uploadListingImageClient } from "@/lib/supabase/storage-client";

export type SheetRow = {
  id: string;
  sku: string;
  samplesReceived: number;
  factoryStock: number;
  whiteBgWithPhotoshoot: boolean;
  whiteBgPieceReturned: boolean;
  modelWithPhotoshoot: boolean;
  modelPieceReturned: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);

  const patchRow = useCallback(
    async (rowId: string, patch: Partial<SheetRow>) => {
      setError(null);
      let snapshot: SheetRow | undefined;
      setRows((prev) => {
        snapshot = prev.find((r) => r.id === rowId);
        return prev.map((r) =>
          r.id === rowId ? { ...r, ...patch } : r,
        );
      });

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
        if (snapshot) {
          setRows((prev) =>
            prev.map((r) => (r.id === rowId ? snapshot! : r)),
          );
        }
        throw new Error(data.error ?? "Failed to save row");
      }
      const updated = (await res.json()) as SheetRow;
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
      return updated;
    },
    [collectionId],
  );

  async function addRow() {
    setAddingRow(true);
    setError(null);
    try {
      const res = await fetch(`/api/collections/${collectionId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "" }),
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
      setAddingRow(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!confirm("Remove this SKU row?")) return;
    setError(null);
    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/rows/${rowId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Could not delete row");
    } catch (e) {
      setRows(snapshot);
      setError(e instanceof Error ? e.message : "Could not delete row");
    }
  }

  const uploadImage = useCallback(
    async (rowId: string, kind: "whiteBg" | "model", file: File) => {
      setError(null);
      const ext = file.name.includes(".")
        ? file.name.split(".").pop()!
        : "jpg";
      const objectPath = `${collectionId}/${rowId}/${kind}-${Date.now()}.${ext}`;

      const publicUrl = await uploadListingImageClient(file, objectPath);

      const res = await fetch(
        `/api/collections/${collectionId}/rows/${rowId}/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, publicUrl }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save image URL");
      }
      const updated = (await res.json()) as SheetRow;
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
    },
    [collectionId],
  );

  function downloadExcel() {
    window.location.href = `/api/collections/${collectionId}/export`;
  }

  const stats = computeSheetStats(rows);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Collection sheet
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">
            {collectionName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            disabled={addingRow}
            className="cursor-pointer rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            {addingRow ? "Adding…" : "+ Row"}
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            className="cursor-pointer rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Download Excel
          </button>
          <DeleteCollectionButton
            collectionId={collectionId}
            collectionName={collectionName}
            skuCount={rows.length}
            redirectTo="/"
          />
        </div>
      </header>

      <SheetDashboard stats={stats} title={`${collectionName} — overview`} />

      {error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="overflow-auto rounded border border-zinc-300 bg-white shadow-sm max-h-[calc(100vh-10rem)]">
        <table className={`${sheetTableClass} min-w-[1200px]`}>
          <thead className="sticky top-0 z-10 border-b border-zinc-300 bg-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
            <tr>
              <th className="border-r border-zinc-200 px-2 py-2">SKU</th>
              <th className="border-r border-zinc-200 px-2 py-2 w-20">Samples</th>
              <th className="border-r border-zinc-200 px-2 py-2 w-40">
                White BG shoot
              </th>
              <th className="border-r border-zinc-200 px-2 py-2 w-40">
                Model shoot
              </th>
              <th className="border-r border-zinc-200 px-2 py-2 w-20">Stock</th>
              <th className="border-r border-zinc-200 px-2 py-2 w-16">Live</th>
              <th className="border-r border-zinc-200 px-2 py-2 min-w-[140px]">
                Not live
              </th>
              <th className="px-2 py-2 w-14" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SheetRowEditor
                key={row.id}
                row={row}
                onPatch={patchRow}
                onUpload={uploadImage}
                onRemove={() => removeRow(row.id)}
                onError={setError}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-zinc-600"
                >
                  No rows yet. Click <strong>+ Row</strong> to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Shoot flow: send <strong>1 pc</strong> → receive production images → mark{" "}
        <strong>piece taken back</strong>. Tab between cells · images auto-compressed
        ~90% on upload.
      </p>
    </div>
  );
}

function SheetRowEditor({
  row,
  onPatch,
  onUpload,
  onRemove,
  onError,
}: {
  row: SheetRow;
  onPatch: (id: string, patch: Partial<SheetRow>) => Promise<SheetRow>;
  onUpload: (id: string, kind: "whiteBg" | "model", file: File) => Promise<void>;
  onRemove: () => void;
  onError: (msg: string | null) => void;
}) {
  const [draft, setDraft] = useState(row);
  const [uploading, setUploading] = useState<"whiteBg" | "model" | null>(null);

  useEffect(() => {
    setDraft(row);
  }, [row]);

  async function commit(patch: Partial<SheetRow>) {
    onError(null);
    try {
      await onPatch(row.id, patch);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
      setDraft(row);
    }
  }

  async function handleUpload(kind: "whiteBg" | "model", file: File) {
    setUploading(kind);
    onError(null);
    try {
      await onUpload(row.id, kind, file);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed");
      throw e;
    } finally {
      setUploading(null);
    }
  }

  return (
    <tr className="border-b border-zinc-200 align-top hover:bg-zinc-50/80">
      <td className="border-r border-zinc-100 px-1 py-0.5">
        <input
          className={`${sheetInputClass} font-mono`}
          value={draft.sku}
          placeholder="SKU"
          onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
          onBlur={() => {
            if (draft.sku !== row.sku) commit({ sku: draft.sku });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </td>
      <td className="border-r border-zinc-100 px-1 py-0.5">
        <NumInput
          value={draft.samplesReceived}
          onCommit={(v) => commit({ samplesReceived: v })}
        />
      </td>
      <td className="border-r border-zinc-100 px-1 py-0.5">
        <ShootCell
          withPhotoshoot={draft.whiteBgWithPhotoshoot}
          pieceReturned={draft.whiteBgPieceReturned}
          onWithPhotoshoot={(v) =>
            commit({
              whiteBgWithPhotoshoot: v,
              whiteBgPieceReturned: v ? false : draft.whiteBgPieceReturned,
            })
          }
          onPieceReturned={(v) =>
            commit({
              whiteBgPieceReturned: v,
              whiteBgWithPhotoshoot: v ? false : draft.whiteBgWithPhotoshoot,
            })
          }
          hasImages={draft.hasWhiteBgImages}
          onHasImages={(v) => commit({ hasWhiteBgImages: v })}
          imageUrl={draft.whiteBgImageUrl}
          uploading={uploading === "whiteBg"}
          onFile={(f) => handleUpload("whiteBg", f)}
          dropLabel="White BG image"
        />
      </td>
      <td className="border-r border-zinc-100 px-1 py-0.5">
        <ShootCell
          withPhotoshoot={draft.modelWithPhotoshoot}
          pieceReturned={draft.modelPieceReturned}
          onWithPhotoshoot={(v) =>
            commit({
              modelWithPhotoshoot: v,
              modelPieceReturned: v ? false : draft.modelPieceReturned,
            })
          }
          onPieceReturned={(v) =>
            commit({
              modelPieceReturned: v,
              modelWithPhotoshoot: v ? false : draft.modelWithPhotoshoot,
            })
          }
          hasImages={draft.hasModelImages}
          onHasImages={(v) => commit({ hasModelImages: v })}
          imageUrl={draft.modelImageUrl}
          uploading={uploading === "model"}
          onFile={(f) => handleUpload("model", f)}
          dropLabel="Model image"
        />
      </td>
      <td className="border-r border-zinc-100 px-1 py-0.5">
        <NumInput
          value={draft.factoryStock}
          onCommit={(v) => commit({ factoryStock: v })}
        />
      </td>
      <td className="border-r border-zinc-100 px-1 py-1">
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
      <td className="border-r border-zinc-100 px-1 py-0.5">
        {!draft.isLiveOnWebsite ? (
          <input
            className={sheetInputClass}
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
          <span className="px-2 text-zinc-400">—</span>
        )}
      </td>
      <td className="px-1 py-1 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] text-red-600 hover:underline"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function ShootCell({
  withPhotoshoot,
  pieceReturned,
  onWithPhotoshoot,
  onPieceReturned,
  hasImages,
  onHasImages,
  imageUrl,
  uploading,
  onFile,
  dropLabel,
}: {
  withPhotoshoot: boolean;
  pieceReturned: boolean;
  onWithPhotoshoot: (v: boolean) => void;
  onPieceReturned: (v: boolean) => void;
  hasImages: boolean;
  onHasImages: (v: boolean) => void;
  imageUrl: string | null;
  uploading: boolean;
  onFile: (f: File) => void | Promise<void>;
  dropLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-1 text-[10px] text-zinc-700">
        <span>1 pc with shoot</span>
        <Toggle
          checked={withPhotoshoot}
          onChange={onWithPhotoshoot}
          disabled={pieceReturned}
        />
      </label>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-zinc-600">Images received</span>
        <Toggle checked={hasImages} onChange={onHasImages} />
      </div>
      {hasImages && (
        <ImageDropzone
          url={imageUrl}
          disabled={uploading}
          label={dropLabel}
          onFile={onFile}
        />
      )}
      <label
        className={`flex items-center justify-between gap-1 text-[10px] ${
          hasImages ? "text-zinc-700" : "text-zinc-400"
        }`}
      >
        <span>Piece taken back</span>
        <Toggle
          checked={pieceReturned}
          onChange={onPieceReturned}
          disabled={!hasImages}
        />
      </label>
    </div>
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

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      className={`${sheetInputClass} text-right tabular-nums`}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.floor(Number(local) || 0));
        setLocal(String(n));
        if (n !== value) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-emerald-600" : "bg-zinc-400"
      }`}
    >
      <span
        className={`mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
