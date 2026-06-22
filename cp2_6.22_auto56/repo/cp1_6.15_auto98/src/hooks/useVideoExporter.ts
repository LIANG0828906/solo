import { useCallback, useRef } from 'react';
import { useMediaContext, type TransitionType } from '@/context/MediaContext';

interface TransitionRenderParams {
  ctx: CanvasRenderingContext2D;
  imgA: HTMLImageElement | null;
  imgB: HTMLImageElement;
  progress: number;
  width: number;
  height: number;
  overlayColor: string | null;
}

const TRANSITION_DURATION = 600;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > canvasRatio) {
    sw = img.naturalHeight * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function applyOverlay(ctx: CanvasRenderingContext2D, color: string | null, w: number, h: number) {
  if (!color) return;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function renderFade({ ctx, imgA, imgB, progress, width, height, overlayColor }: TransitionRenderParams) {
  ctx.clearRect(0, 0, width, height);
  if (imgA) {
    ctx.globalAlpha = 1;
    drawImageCover(ctx, imgA, width, height);
    applyOverlay(ctx, overlayColor, width, height);
  }
  ctx.globalAlpha = easeOut(progress);
  drawImageCover(ctx, imgB, width, height);
  applyOverlay(ctx, overlayColor, width, height);
  ctx.globalAlpha = 1;
}

function renderSlideLeft({ ctx, imgA, imgB, progress, width, height, overlayColor }: TransitionRenderParams) {
  ctx.clearRect(0, 0, width, height);
  const p = easeOut(progress);
  if (imgA) {
    ctx.save();
    ctx.translate(-width * p, 0);
    drawImageCover(ctx, imgA, width, height);
    applyOverlay(ctx, overlayColor, width, height);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(width * (1 - p), 0);
  drawImageCover(ctx, imgB, width, height);
  applyOverlay(ctx, overlayColor, width, height);
  ctx.restore();
}

function renderZoom({ ctx, imgA, imgB, progress, width, height, overlayColor }: TransitionRenderParams) {
  ctx.clearRect(0, 0, width, height);
  const p = easeOut(progress);
  if (imgA) {
    ctx.save();
    const scaleA = 1 + p * 0.1;
    ctx.globalAlpha = 1 - p;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scaleA, scaleA);
    ctx.translate(-width / 2, -height / 2);
    drawImageCover(ctx, imgA, width, height);
    ctx.restore();
  }
  ctx.save();
  const scaleB = 0.5 + 0.5 * p;
  ctx.globalAlpha = p;
  ctx.translate(width / 2, height / 2);
  ctx.scale(scaleB, scaleB);
  ctx.translate(-width / 2, -height / 2);
  drawImageCover(ctx, imgB, width, height);
  applyOverlay(ctx, overlayColor, width, height);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function renderRotate({ ctx, imgA, imgB, progress, width, height, overlayColor }: TransitionRenderParams) {
  ctx.clearRect(0, 0, width, height);
  const p = easeOut(progress);
  if (imgA) {
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(p * 0.1);
    ctx.scale(1 + p * 0.05, 1 + p * 0.05);
    ctx.translate(-width / 2, -height / 2);
    drawImageCover(ctx, imgA, width, height);
    ctx.restore();
  }
  ctx.save();
  const scaleB = 0.8 + 0.2 * p;
  const angleB = -0.26 * (1 - p);
  ctx.globalAlpha = p;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angleB);
  ctx.scale(scaleB, scaleB);
  ctx.translate(-width / 2, -height / 2);
  drawImageCover(ctx, imgB, width, height);
  applyOverlay(ctx, overlayColor, width, height);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function renderCheckerboard({ ctx, imgA, imgB, progress, width, height, overlayColor }: TransitionRenderParams) {
  ctx.clearRect(0, 0, width, height);
  if (imgA) {
    drawImageCover(ctx, imgA, width, height);
    applyOverlay(ctx, overlayColor, width, height);
  }
  const cols = 8;
  const rows = 8;
  const cellW = width / cols;
  const cellH = height / rows;
  const totalCells = cols * rows;
  const revealed = Math.floor(easeOut(progress) * totalCells);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const hash = ((idx * 7 + 13) * 31) % totalCells;
      if (hash < revealed) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(c * cellW, r * cellH, cellW, cellH);
        ctx.clip();
        drawImageCover(ctx, imgB, width, height);
        applyOverlay(ctx, overlayColor, width, height);
        ctx.restore();
      }
    }
  }
}

const TRANSITION_RENDERERS: Record<TransitionType, (params: TransitionRenderParams) => void> = {
  fade: renderFade,
  slideLeft: renderSlideLeft,
  zoom: renderZoom,
  rotate: renderRotate,
  checkerboard: renderCheckerboard,
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function useVideoExporter() {
  const { state, dispatch } = useMediaContext();
  const animationRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const loadAllPhotos = useCallback(async (): Promise<HTMLImageElement[]> => {
    const sorted = [...state.photos].sort((a, b) => a.order - b.order);
    const images: HTMLImageElement[] = [];
    for (const photo of sorted) {
      const img = await loadImage(photo.file);
      images.push(img);
    }
    return images;
  }, [state.photos]);

  const playPreview = useCallback(async (
    canvas: HTMLCanvasElement,
    onFrame?: (photoIndex: number) => void
  ) => {
    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const images = await loadAllPhotos();
    if (images.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const photoDurationMs = state.photoDuration * 1000;
    const transitionMs = TRANSITION_DURATION;

    dispatch({ type: 'SET_PREVIEW_PLAYING', payload: true });

    if (state.audioUrl && state.audioFile) {
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const arrayBuffer = await state.audioFile.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = state.volume / 100;
        gainNodeRef.current = gainNode;
        if (state.fadeInOut) {
          const now = audioCtx.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(state.volume / 100, now + 1);
          const endTime = now + audioBuffer.duration;
          gainNode.gain.setValueAtTime(state.volume / 100, endTime - 1);
          gainNode.gain.linearRampToValueAtTime(0, endTime);
        }
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        source.start(0);
        sourceRef.current = source;
        source.onended = () => {
          audioCtx.close();
          audioCtxRef.current = null;
          analyserRef.current = null;
          sourceRef.current = null;
          gainNodeRef.current = null;
        };
      } catch (e) {
        console.error('Audio playback error:', e);
      }
    }

    const totalDuration = images.length * photoDurationMs;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      if (elapsed >= totalDuration) {
        const lastImg = images[images.length - 1];
        ctx.clearRect(0, 0, width, height);
        drawImageCover(ctx, lastImg, width, height);
        applyOverlay(ctx, state.overlayColor, width, height);
        dispatch({ type: 'SET_PREVIEW_PLAYING', payload: false });
        return;
      }

      const photoIndex = Math.min(
        Math.floor(elapsed / photoDurationMs),
        images.length - 1
      );
      onFrame?.(photoIndex);

      const timeInPhoto = elapsed - photoIndex * photoDurationMs;
      const isTransitioning =
        photoIndex > 0 && timeInPhoto < transitionMs;

      ctx.clearRect(0, 0, width, height);

      if (isTransitioning) {
        const progress = timeInPhoto / transitionMs;
        const renderer = TRANSITION_RENDERERS[state.transitionType];
        renderer({
          ctx,
          imgA: images[photoIndex - 1],
          imgB: images[photoIndex],
          progress,
          width,
          height,
          overlayColor: state.overlayColor,
        });
      } else {
        drawImageCover(ctx, images[photoIndex], width, height);
        applyOverlay(ctx, state.overlayColor, width, height);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [state.photos, state.transitionType, state.photoDuration, state.overlayColor, state.audioUrl, state.audioFile, state.volume, state.fadeInOut, loadAllPhotos, dispatch]);

  const stopPreview = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* already stopped */ }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    gainNodeRef.current = null;
    dispatch({ type: 'SET_PREVIEW_PLAYING', payload: false });
  }, [dispatch]);

  const drawWaveform = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = 32;
    const barWidth = (width / barCount) * 0.7;
    const gap = (width / barCount) * 0.3;
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = Math.max(2, value * height * 0.9);
      const x = i * (barWidth + gap);
      const y = height - barHeight;

      const isPeak = value > 0.7;
      if (isPeak) {
        const r = parseInt('4a', 16);
        const g = parseInt('90', 16);
        const b = parseInt('d9', 16);
        const brightR = Math.min(255, r + Math.round(r * 0.2));
        const brightG = Math.min(255, g + Math.round(g * 0.2));
        const brightB = Math.min(255, b + Math.round(b * 0.2));
        ctx.fillStyle = `rgb(${brightR}, ${brightG}, ${brightB})`;
      } else {
        ctx.fillStyle = '#4a90d9';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }, []);

  const exportVideo = useCallback(async () => {
    const images = await loadAllPhotos();
    if (images.length === 0) return;

    dispatch({ type: 'SET_EXPORTING', payload: true });
    dispatch({ type: 'SET_EXPORT_PROGRESS', payload: 0 });

    const offscreen = document.createElement('canvas');
    offscreen.width = 1280;
    offscreen.height = 720;
    const ctx = offscreen.getContext('2d')!;

    const fps = 30;
    const photoDurationMs = state.photoDuration * 1000;
    const transitionMs = TRANSITION_DURATION;
    const totalFrames = Math.ceil((images.length * photoDurationMs) / 1000 * fps);

    const stream = offscreen.captureStream(fps);

    let audioCtx: AudioContext | null = null;
    let audioSource: AudioBufferSourceNode | null = null;

    if (state.audioFile && state.audioUrl) {
      try {
        audioCtx = new AudioContext();
        const arrayBuffer = await state.audioFile.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = audioBuffer;
        const dest = audioCtx.createMediaStreamDestination();
        const gain = audioCtx.createGain();
        gain.gain.value = state.volume / 100;
        if (state.fadeInOut) {
          const now = audioCtx.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(state.volume / 100, now + 1);
          const endTime = now + audioBuffer.duration;
          gain.gain.setValueAtTime(state.volume / 100, endTime - 1);
          gain.gain.linearRampToValueAtTime(0, endTime);
        }
        audioSource.connect(gain);
        gain.connect(dest);
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        audioSource.start(0);
      } catch (e) {
        console.error('Audio export error:', e);
      }
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-collage-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (audioSource) {
          try { audioSource.stop(); } catch { /* */ }
        }
        if (audioCtx) {
          audioCtx.close();
        }

        dispatch({ type: 'SET_EXPORTING', payload: false });
        dispatch({ type: 'SET_EXPORT_PROGRESS', payload: 100 });
        resolve();
      };

      recorder.start();

      const width = offscreen.width;
      const height = offscreen.height;
      let currentFrame = 0;

      function renderFrame() {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          return;
        }

        const elapsedMs = (currentFrame / fps) * 1000;
        const photoIndex = Math.min(
          Math.floor(elapsedMs / photoDurationMs),
          images.length - 1
        );
        const timeInPhoto = elapsedMs - photoIndex * photoDurationMs;
        const isTransitioning = photoIndex > 0 && timeInPhoto < transitionMs;

        ctx.clearRect(0, 0, width, height);

        if (isTransitioning) {
          const progress = timeInPhoto / transitionMs;
          const renderer = TRANSITION_RENDERERS[state.transitionType];
          renderer({
            ctx,
            imgA: images[photoIndex - 1],
            imgB: images[photoIndex],
            progress,
            width,
            height,
            overlayColor: state.overlayColor,
          });
        } else {
          drawImageCover(ctx, images[photoIndex], width, height);
          applyOverlay(ctx, state.overlayColor, width, height);
        }

        currentFrame++;
        const progress = Math.round((currentFrame / totalFrames) * 100);
        dispatch({ type: 'SET_EXPORT_PROGRESS', payload: progress });

        requestAnimationFrame(renderFrame);
      }

      renderFrame();
    });
  }, [state, loadAllPhotos, dispatch]);

  return {
    playPreview,
    stopPreview,
    drawWaveform,
    exportVideo,
    isPreviewPlaying: state.isPreviewPlaying,
    isExporting: state.isExporting,
    exportProgress: state.exportProgress,
  };
}
