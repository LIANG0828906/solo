import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export async function captureScroll(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob from canvas'));
      }
    }, 'image/png');
  });
}

export function downloadBalmImage(blob: Blob, filename: string): void {
  const finalFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
  saveAs(blob, finalFilename);
}
