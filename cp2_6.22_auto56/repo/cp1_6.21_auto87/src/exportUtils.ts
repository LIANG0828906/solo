import type { EmotionType, PaletteColors, ExportedPalette } from './types';

export function exportPalette(
  primaryHue: number,
  emotion: EmotionType,
  emotionLabel: string,
  colors: PaletteColors
): void {
  const payload: ExportedPalette = {
    timestamp: Date.now(),
    primaryHue,
    emotion,
    emotionLabel,
    colors
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `palette-${payload.timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
