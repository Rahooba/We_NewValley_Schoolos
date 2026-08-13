// Files are uploaded as PRIVATE blobs (see lib/blob-upload.ts), so the raw
// blob.url stored in the database is NOT directly browsable — opening it
// straight in an <a href> or <img src> returns "Forbidden" without a signed
// request. Always render private files through /api/files/stream instead,
// which streams the file server-side after checking the viewer's permission
// for that file's path (see PATHNAME_PERMISSIONS in that route).
export function blobViewUrl(rawUrl: string, download = false): string {
  let pathname = rawUrl;
  try {
    pathname = new URL(rawUrl).pathname.replace(/^\/+/, '');
  } catch {
    // rawUrl wasn't a full URL (already a pathname) — use as-is.
  }
  const params = new URLSearchParams({ pathname });
  if (download) params.set('download', '1');
  return `/api/files/stream?${params.toString()}`;
}
