import JSZip from 'jszip';
import type { FrameData } from '../types';
import { frameToDataUrl } from './frame';

export async function exportFramesAsZip(frames: FrameData[]): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < frames.length; i++) {
    const dataUrl = frameToDataUrl(frames[i], 192);
    const base64 = dataUrl.split(',')[1];
    zip.file(`frame_${String(i + 1).padStart(3, '0')}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frames.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadGif(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'animation.gif';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
