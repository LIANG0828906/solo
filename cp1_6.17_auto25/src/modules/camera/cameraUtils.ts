export async function getUserMedia(
  videoRef: React.RefObject<HTMLVideoElement>,
  width: number = 640,
  height: number = 480
): Promise<MediaStream | null> {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: 'environment',
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    return stream;
  } catch (error) {
    console.error('获取摄像头权限失败:', error);
    return null;
  }
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function captureFrame(
  videoRef: React.RefObject<HTMLVideoElement>,
  width: number = 640,
  height: number = 480
): string | null {
  if (!videoRef.current) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const video = videoRef.current;
  const videoWidth = video.videoWidth || width;
  const videoHeight = video.videoHeight || height;

  const scale = Math.max(width / videoWidth, height / videoHeight);
  const x = (width - videoWidth * scale) / 2;
  const y = (height - videoHeight * scale) / 2;

  ctx.drawImage(video, x, y, videoWidth * scale, videoHeight * scale);

  return canvas.toDataURL('image/png');
}

export function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}
