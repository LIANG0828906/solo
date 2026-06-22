import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Annotation, ExportParams, FrameData } from './types';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (!ffmpegLoaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegLoaded = true;
  }

  return ffmpegInstance;
}

export interface ExportProgress {
  current: number;
  total: number;
  stage: 'encoding' | 'writing';
}

function renderAnnotationOnCanvas(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
): void {
  ctx.save();

  if (annotation.type === 'rectangle') {
    const cx = annotation.x + annotation.width / 2;
    const cy = annotation.y + annotation.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((annotation.rotation * Math.PI) / 180);
    ctx.strokeStyle = annotation.borderColor;
    ctx.lineWidth = annotation.borderWidth;
    ctx.strokeRect(-annotation.width / 2, -annotation.height / 2, annotation.width, annotation.height);
  } else if (annotation.type === 'arrow') {
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = (annotation.x + annotation.endX) / 2;
    const cy = (annotation.y + annotation.endY) / 2;
    ctx.translate(cx, cy);
    ctx.rotate((annotation.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    ctx.beginPath();
    ctx.moveTo(annotation.x, annotation.y);
    ctx.lineTo(annotation.endX, annotation.endY);
    ctx.stroke();

    const angle = Math.atan2(annotation.endY - annotation.y, annotation.endX - annotation.x);
    const headLen = 12 + annotation.lineWidth * 2;

    ctx.beginPath();
    ctx.moveTo(annotation.endX, annotation.endY);
    ctx.lineTo(
      annotation.endX - headLen * Math.cos(angle - Math.PI / 6),
      annotation.endY - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      annotation.endX - headLen * Math.cos(angle + Math.PI / 6),
      annotation.endY - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  } else if (annotation.type === 'text') {
    ctx.fillStyle = annotation.color;
    ctx.font = `${annotation.italic ? 'italic ' : ''}${annotation.fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';

    const cx = annotation.x;
    const cy = annotation.y;
    ctx.translate(cx, cy);
    ctx.rotate((annotation.rotation * Math.PI) / 180);
    ctx.fillText(annotation.content, 0, 0);
  }

  ctx.restore();
}

export async function exportVideo(
  frames: FrameData[],
  annotations: Record<number, Annotation[]>,
  params: ExportParams,
  onProgress?: (progress: ExportProgress) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const total = frames.length;

  const tempCanvas = document.createElement('canvas');
  if (frames.length > 0) {
    tempCanvas.width = frames[0].imageData.width;
    tempCanvas.height = frames[0].imageData.height;
  }
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Canvas 初始化失败');

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    tempCtx.putImageData(frame.imageData, 0, 0);

    if (params.withAnnotations !== false) {
      const frameAnnotations = annotations[i] || [];
      for (const ann of frameAnnotations) {
        renderAnnotationOnCanvas(tempCtx, ann);
      }
    }

    const dataUrl = tempCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) {
      bytes[j] = binary.charCodeAt(j);
    }

    await ffmpeg.writeFile(`frame_${String(i).padStart(6, '0')}.png`, bytes);
    onProgress?.({ current: i + 1, total, stage: 'encoding' });
  }

  const outputName = `output.${params.format}`;
  const fpsArg = String(params.fps || 10);
  const loopArg = params.format === 'gif' && params.loop ? '-loop' : undefined;

  const command: string[] = [
    '-framerate', fpsArg,
    '-i', 'frame_%06d.png',
  ];

  if (params.format === 'gif') {
    command.push(
      '-vf', `fps=${fpsArg},scale=${tempCanvas.width}:-1:flags=lanczos`,
    );
    if (!params.loop) {
      command.push('-loop', '-1');
    }
  } else {
    command.push('-c:v', 'libvpx-vp9', '-b:v', '2M');
  }

  command.push('-y', outputName);

  await ffmpeg.exec(command);
  onProgress?.({ current: total, total, stage: 'writing' });

  const outputData = await ffmpeg.readFile(outputName);
  const blob = new Blob([outputData], {
    type: params.format === 'gif' ? 'image/gif' : 'video/webm',
  });

  for (let i = 0; i < frames.length; i++) {
    try {
      await ffmpeg.deleteFile(`frame_${String(i).padStart(6, '0')}.png`);
    } catch {}
  }
  try {
    await ffmpeg.deleteFile(outputName);
  } catch {}

  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generateTimestampFilename(format: 'gif' | 'webm'): string {
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `SnapScape_${ts}.${format}`;
}
