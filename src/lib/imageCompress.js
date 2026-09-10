/**
 * Compresses an image file in-browser before upload: caps the longest
 * side at maxDimension and re-encodes as JPEG at the given quality.
 * Falls back to the original file if anything goes wrong (e.g. an
 * already-tiny image, or a browser that blocks canvas export).
 */
export async function compressImage(file, { maxDimension = 1600, quality = 0.7 } = {}) {
  if (!file || !file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file

    const compressedName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], compressedName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
