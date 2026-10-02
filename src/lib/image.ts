/**
 * Compresse une photo choisie dans la galerie du téléphone :
 * 1000 px max, WebP (JPEG en secours), visé sous ~100 Ko.
 */
export async function compressImage(file: File, maxSide = 1000, targetBytes = 100_000): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let side = maxSide;
  let best = '';
  for (const quality of [0.8, 0.7, 0.6, 0.5]) {
    const ratio = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let url = canvas.toDataURL('image/webp', quality);
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality);
    best = url;
    if (url.length * 0.75 <= targetBytes) break;
    side = Math.round(side * 0.85);
  }
  bitmap.close();
  return best;
}
