// Images are either bundled files in /public/images or uploads in the public
// site-media bucket. Every URL saved by the site editor must match one of them.
export const MEDIA_BUCKET = "site-media";
export const mediaFolders = ["site", "gallery", "stylists", "services"] as const;
export type MediaFolder = (typeof mediaFolders)[number];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const acceptedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const DEFAULT_POSITION = "50% 50%";

const localImage = /^\/images\/[A-Za-z0-9._-]+$/;
const uploadedPath =
  /^(site|gallery|stylists|services)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|avif)$/;
const position = /^(\d{1,3})% (\d{1,3})%$/;

export function mediaPrefix(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

/** Object path inside the bucket, or null when the URL is not one of our uploads. */
export function mediaPath(url: string, supabaseUrl: string): string | null {
  const prefix = mediaPrefix(supabaseUrl);
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return uploadedPath.test(path) ? path : null;
}

export function isAllowedImage(url: unknown, supabaseUrl: string): url is string {
  return (
    typeof url === "string" &&
    (localImage.test(url) || mediaPath(url, supabaseUrl) !== null)
  );
}

/** "x% y%" with both values between 0 and 100, as stored in the database. */
export function isPosition(value: unknown): value is string {
  const match = typeof value === "string" ? value.match(position) : null;
  return !!match && Number(match[1]) <= 100 && Number(match[2]) <= 100;
}

export function splitPosition(value: string): [number, number] {
  const match = value.match(position);
  return match ? [Number(match[1]), Number(match[2])] : [50, 50];
}
