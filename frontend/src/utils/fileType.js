/**
 * Browser file picker sometimes returns empty file.type (especially on Windows).
 * Must match backend allowed types for presigned URL.
 */
const EXT_TO_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export function resolveContentType(file) {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type.toLowerCase();
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const mime = ext && EXT_TO_MIME[ext];

  if (!mime) {
    throw new Error(
      'Could not detect file type. Use PNG, JPG, WEBP, or PDF with a correct file extension.',
    );
  }

  return mime;
}
