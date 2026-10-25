"use client";

import { useCallback, useState } from "react";

type Props = {
  url: string | null;
  disabled?: boolean;
  label: string;
  onFile: (file: File) => void | Promise<void>;
};

export function ImageDropzone({ url, disabled, label, onFile }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = files[0];
      if (!file || disabled) return;
      if (!file.type.startsWith("image/")) {
        setLocalError("Please drop an image file.");
        return;
      }
      setLocalError(null);
      try {
        await onFile(file);
      } catch (e) {
        setLocalError(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [disabled, onFile],
  );

  return (
    <div className="mt-1.5 space-y-1">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex min-h-[72px] flex-col items-center justify-center rounded border-2 border-dashed px-2 py-2 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-zinc-300 bg-white hover:border-zinc-400"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="mb-1 h-12 w-12 rounded object-cover"
          />
        ) : null}
        <span className="text-[11px] font-medium text-zinc-700">
          {dragOver ? "Drop image" : "Drag & drop or click"}
        </span>
        <span className="text-[10px] text-zinc-500">{label}</span>
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) handleFiles(list);
            e.target.value = "";
          }}
        />
      </div>
      {localError && (
        <p className="text-[10px] text-red-600">{localError}</p>
      )}
    </div>
  );
}
