/**
 * Downscale a photo in the browser before upload. The /api/scan route caps
 * uploads at 8 MB; phone photos routinely exceed that, so we re-encode to a
 * max edge of 1600px as JPEG. Returns the original file unchanged if anything
 * about the canvas path fails or the image is already small.
 */
const MAX_EDGE = 1600;
const SKIP_UNDER_BYTES = 1.2 * 1024 * 1024;

export async function downscaleImage(file: File): Promise<File | Blob> {
  if (file.size < SKIP_UNDER_BYTES) return file;
  if (typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
