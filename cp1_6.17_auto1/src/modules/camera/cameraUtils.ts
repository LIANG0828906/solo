export async function getUserMedia(
  width: number,
  height: number
): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: width },
      height: { ideal: height },
      facingMode: 'environment',
    },
    audio: false,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    const fallbackConstraints: MediaStreamConstraints = {
      video: true,
      audio: false,
    };
    return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
  }
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function captureFrame(
  video: HTMLVideoElement,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
