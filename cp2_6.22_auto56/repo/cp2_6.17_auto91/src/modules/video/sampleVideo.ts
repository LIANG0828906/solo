export async function generateSampleVideo(duration: number = 10): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const stream = canvas.captureStream(30);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2_500_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    mediaRecorder.onerror = () => {
      reject(new Error('Failed to record sample video'));
    };

    mediaRecorder.start(100);

    const startTime = performance.now();
    const fps = 30;
    const frameInterval = 1000 / fps;
    let frameCount = 0;
    const totalFrames = duration * fps;

    const drawFrame = () => {
      if (frameCount >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const elapsed = frameCount / fps;
      const progress = elapsed / duration;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const hue = (progress * 360) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      const rectSize = 100 + Math.sin(progress * Math.PI * 4) * 40;
      ctx.fillRect(
        canvas.width / 2 - rectSize / 2,
        canvas.height / 2 - rectSize / 2,
        rectSize,
        rectSize
      );

      ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, 60%)`;
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + Math.cos(progress * Math.PI * 2) * 150,
        canvas.height / 2 + Math.sin(progress * Math.PI * 2) * 100,
        30,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ClipCanvas Demo ${elapsed.toFixed(1)}s`, canvas.width / 2, 40);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const barWidth = (canvas.width - 80) / 5;
        const barHeight = 20 + Math.sin(progress * Math.PI * 6 + i) * 15;
        ctx.strokeRect(
          40 + i * barWidth + 5,
          canvas.height - 60 - barHeight,
          barWidth - 10,
          barHeight
        );
      }

      frameCount++;
      const nextFrameTime = startTime + frameCount * frameInterval;
      const delay = Math.max(0, nextFrameTime - performance.now());
      setTimeout(drawFrame, delay);
    };

    drawFrame();
  });
}
