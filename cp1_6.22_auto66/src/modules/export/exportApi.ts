import type { Frame } from '../../types';

export async function exportPdf(frames: Frame[]): Promise<void> {
  const response = await fetch('/api/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ frames }),
  });

  if (!response.ok) {
    throw new Error(`HTTP错误: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storyboard-script-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
