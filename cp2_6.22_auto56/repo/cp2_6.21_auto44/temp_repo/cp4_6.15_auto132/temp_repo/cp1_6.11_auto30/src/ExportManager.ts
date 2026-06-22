import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ExportImage {
  name: string;
  blob: Blob;
}

function replaceExtensionToWebp(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename + '.webp';
  }
  return filename.substring(0, lastDotIndex) + '.webp';
}

export async function exportAsZip(images: ExportImage[]): Promise<void> {
  const zip = new JSZip();

  images.forEach((image) => {
    const webpName = replaceExtensionToWebp(image.name);
    zip.file(webpName, image.blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'compressed-images.zip');
}
