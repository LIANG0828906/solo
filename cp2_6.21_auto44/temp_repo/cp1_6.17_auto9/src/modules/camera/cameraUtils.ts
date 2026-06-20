export async function startCamera(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 30 },
      audio: false,
    })
    videoElement.srcObject = stream
    await videoElement.play()
    return stream
  } catch (err) {
    console.error('摄像头启动失败:', err)
    return null
  }
}

export function stopCamera(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

export function captureFrame(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth || 640
  canvas.height = videoElement.videoHeight || 480
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
  }
  return canvas.toDataURL('image/png')
}
