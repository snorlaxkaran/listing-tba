"use client";

/** Keep at most ~10% of original file size (≈90% reduction). */
const TARGET_SIZE_RATIO = 0.1;
const MAX_EDGE_PX = 1280;
const MIN_EDGE_PX = 640;
const MIN_QUALITY = 0.32;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress image."));
      },
      "image/jpeg",
      quality,
    );
  });
}

function drawScaled(
  img: HTMLImageElement,
  maxEdge: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress image.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const img = await loadImage(file);
  const targetBytes = Math.max(32_000, file.size * TARGET_SIZE_RATIO);
  let maxEdge = MAX_EDGE_PX;
  let quality = 0.72;
  let best: Blob | null = null;

  while (maxEdge >= MIN_EDGE_PX) {
    const canvas = drawScaled(img, maxEdge);
    while (quality >= MIN_QUALITY) {
      const blob = await canvasToBlob(canvas, quality);
      best = blob;
      if (blob.size <= targetBytes) {
        return new File([blob], stripExt(file.name) + ".jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
      quality -= 0.08;
    }
    maxEdge -= 160;
    quality = 0.72;
  }

  if (!best) {
    throw new Error("Could not compress image.");
  }

  return new File([best], stripExt(file.name) + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}
