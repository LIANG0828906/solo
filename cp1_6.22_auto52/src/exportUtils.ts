export interface ExportOptions {
  filename?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export function exportCanvasToPNG(
  canvas: HTMLCanvasElement,
  options: ExportOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (options.onStart) {
      options.onStart();
    }

    const timer = setTimeout(() => {
      const dataURL = canvas.toDataURL('image/png');
      const filename = options.filename || `artwork_${formatTimestamp()}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (options.onComplete) {
        options.onComplete();
      }

      resolve();
    }, 300);
  });
}

export function generateFilename(prefix = 'artwork'): string {
  return `${prefix}_${formatTimestamp()}.png`;
}
