export async function getUserMedia(
  videoElement: HTMLVideoElement,
  width = 640,
  height = 480
): Promise<MediaStream | null> {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: 30 },
      },
      audio: false,
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoElement.srcObject = stream
    await videoElement.play()
    return stream
  } catch (error) {
    console.error('获取摄像头权限失败:', error)
    return null
  }
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return
  stream.getTracks().forEach((track) => track.stop())
}

export function captureFrame(
  videoElement: HTMLVideoElement,
  width = 640,
  height = 480
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建Canvas上下文')
  ctx.drawImage(videoElement, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
