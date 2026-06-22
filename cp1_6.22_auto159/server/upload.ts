import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage() });

export function imageToBase64(buffer: Buffer, mimetype: string): string {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
}
