type FaceDetectorInstance = { detect: (image: CanvasImageSource) => Promise<FaceDetectionLike[]> };
type FaceDetectorCtor = new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorInstance;
type FaceDetectionLike = { boundingBox: DOMRectReadOnly };

function getFaceDetectorCtor(): FaceDetectorCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  return ctor ?? null;
}

export function isFaceDetectorSupported(): boolean {
  return getFaceDetectorCtor() != null;
}

/**
 * Devuelve un vector -1…1 por eje: desplazamiento de la cara respecto al centro del vídeo.
 */
export async function detectFaceCenterNudge(
  video: HTMLVideoElement
): Promise<{ x: number; y: number } | null> {
  const Ctor = getFaceDetectorCtor();
  if (!Ctor || video.readyState < 2) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw < 8 || vh < 8) return null;
  try {
    const detector = new Ctor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = (await detector.detect(video)) as FaceDetectionLike[];
    if (!faces?.length) return null;
    const b = faces[0].boundingBox;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const nx = (cx / vw - 0.5) * 2;
    const ny = (cy / vh - 0.5) * 2;
    return {
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    };
  } catch {
    return null;
  }
}

export function lerpFaceNudge(
  prev: { x: number; y: number },
  next: { x: number; y: number } | null,
  alpha: number
): { x: number; y: number } {
  if (!next) {
    return {
      x: prev.x * (1 - alpha),
      y: prev.y * (1 - alpha),
    };
  }
  return {
    x: prev.x + (next.x - prev.x) * alpha,
    y: prev.y + (next.y - prev.y) * alpha,
  };
}
