import JSZip from 'jszip';
import { ParticleCanvas } from '../canvas/ParticleCanvas';
import type { Keyframe } from '../store/types';
import { getInterpolatedParticles } from '../canvas/ParticleCanvas';

export async function exportKeyframesAsPngSequence(
  keyframes: Keyframe[],
  totalFrames: number,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  if (keyframes.length === 0) return;

  const zip = new JSZip();
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasWidth;
  exportCanvas.height = canvasHeight;

  const particleCanvas = new ParticleCanvas(exportCanvas);

  const sortedKeyframes = [...keyframes].sort((a, b) => a.frameIndex - b.frameIndex);

  const frameIndices = new Set<number>();
  for (const kf of sortedKeyframes) {
    frameIndices.add(kf.frameIndex);
  }
  const minFrame = sortedKeyframes[0].frameIndex;
  const maxFrame = sortedKeyframes[sortedKeyframes.length - 1].frameIndex;

  for (let f = minFrame; f <= maxFrame; f++) {
    const particles = getInterpolatedParticles(sortedKeyframes, f);

    const ctx = exportCanvas.getContext('2d')!;
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    particleCanvas.render(particles, null, 1, { x: 0, y: 0 });

    const dataUrl = exportCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const paddedIndex = String(f).padStart(4, '0');
    zip.file(`frame_${paddedIndex}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lightparticle_animation.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
