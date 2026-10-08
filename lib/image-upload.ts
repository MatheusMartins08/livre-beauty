"use client";

import { createClient } from "@/lib/supabase/client";
import {
  acceptedImageTypes,
  MAX_UPLOAD_BYTES,
  MEDIA_BUCKET,
  mediaPath,
  type MediaFolder,
} from "./media";
import { supabaseConfig } from "./supabase/config";

const MAX_SIDE = 1600;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Large photos are resized in the browser so the site stays light. */
async function optimize(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    // Keep the original when the browser cannot encode WebP or it is not smaller.
    return blob?.type === "image/webp" && (scale < 1 || blob.size < file.size)
      ? blob
      : file;
  } catch {
    return file;
  }
}

export async function uploadSiteImage(
  file: File,
  folder: MediaFolder,
): Promise<string> {
  if (!acceptedImageTypes.includes(file.type))
    throw new Error("Use uma imagem JPG, PNG, WebP ou AVIF.");
  if (!file.size || file.size > MAX_UPLOAD_BYTES * 4)
    throw new Error("Escolha uma imagem de até 20 MB.");
  const image = await optimize(file);
  if (image.size > MAX_UPLOAD_BYTES)
    throw new Error("A imagem continua acima de 5 MB. Escolha uma foto menor.");
  const path = `${folder}/${crypto.randomUUID()}.${extensions[image.type]}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, image, {
    contentType: image.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error)
    throw new Error("Não foi possível enviar a imagem. Tente novamente.");
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Removes an upload that was never saved; failures only leave an unused file. */
export async function discardUploads(urls: string[]) {
  const { url } = supabaseConfig();
  const paths = urls.flatMap((image) => mediaPath(image, url) ?? []);
  if (!paths.length) return;
  try {
    await createClient().storage.from(MEDIA_BUCKET).remove(paths);
  } catch {
    // The owner can still save; an orphan file does not affect the site.
  }
}
