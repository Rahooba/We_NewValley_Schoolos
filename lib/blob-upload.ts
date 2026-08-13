import { put, PutBlobResult } from '@vercel/blob';

export async function uploadPrivateFile(
  pathname: string,
  file: File,
  options?: { contentType?: string; allowOverwrite?: boolean }
): Promise<PutBlobResult> {
  return put(pathname, file, {
    access: 'private',
    allowOverwrite: options?.allowOverwrite ?? false,
    contentType: options?.contentType ?? (file.type || undefined),
  });
}
