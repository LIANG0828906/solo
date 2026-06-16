export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export async function validateAndConvertImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('仅支持 JPG 和 PNG 格式的图片');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('图片大小不能超过 5MB');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}
