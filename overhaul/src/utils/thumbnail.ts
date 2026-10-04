const MAX_EDGE = 480;

export interface Thumbnail { blob: Blob; width: number; height: number; duration?: number }

const toJpeg = (source: CanvasImageSource, w: number, h: number) => new Promise<Blob | null>(resolve => {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h)), canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return resolve(null);
  ctx.fillStyle = '#fff'; // JPEG has no alpha: flatten transparent PNGs onto white
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(resolve, 'image/jpeg', 0.8);
});

async function fromImage(file: File): Promise<Thumbnail | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const blob = await toJpeg(bitmap, bitmap.width, bitmap.height);
    return blob && { blob, width: bitmap.width, height: bitmap.height };
  } finally { bitmap.close(); }
}

function fromVideo(file: File): Promise<Thumbnail | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file), video = document.createElement('video');
    const done = (result: Thumbnail | null) => { clearTimeout(timer); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); resolve(result); };
    const timer = setTimeout(() => done(null), 10_000);
    video.muted = true; video.preload = 'metadata'; video.playsInline = true;
    video.onerror = () => done(null);
    video.onloadedmetadata = () => { video.currentTime = Math.min(1, (video.duration || 0) / 2); };
    video.onseeked = () => {
      const { videoWidth: w, videoHeight: h, duration } = video;
      if (!w || !h) return done(null);
      void toJpeg(video, w, h).then(blob => done(blob && { blob, width: w, height: h, duration: Number.isFinite(duration) ? duration : undefined }));
    };
    video.src = url;
  });
}

/** Best-effort JPEG preview for an image or video; null when the browser cannot decode it (the UI then shows the file icon). */
export async function makeThumbnail(file: File): Promise<Thumbnail | null> {
  try {
    if (file.type.startsWith('image/')) return await fromImage(file);
    if (file.type.startsWith('video/')) return await fromVideo(file);
  } catch { /* undecodable: no thumbnail */ }
  return null;
}
