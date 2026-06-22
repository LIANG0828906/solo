import { toPng } from 'html-to-image';

export async function captureScreenshot(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#1E1E1E',
    pixelRatio: 2,
  });

  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = dataUrl;
  link.click();
}

export async function generateScreenshotBlob(
  element: HTMLElement
): Promise<Blob | null> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#1E1E1E',
    pixelRatio: 2,
  });
  const res = await fetch(dataUrl);
  return res.blob();
}
