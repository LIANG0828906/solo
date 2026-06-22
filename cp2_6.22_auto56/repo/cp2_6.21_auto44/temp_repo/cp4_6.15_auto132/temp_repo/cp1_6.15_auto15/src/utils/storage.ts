import type { Plant, Photo } from '../types';

const PLANTS_KEY = 'plant-tracker-plants';
const PHOTOS_KEY = 'plant-tracker-photos';

export const loadPlants = (): Plant[] => {
  try {
    const data = localStorage.getItem(PLANTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePlants = (plants: Plant[]): void => {
  localStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
};

export const loadPhotos = (): Photo[] => {
  try {
    const data = localStorage.getItem(PHOTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePhotos = (photos: Photo[]): void => {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
};

export const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    /**
     * 压缩策略说明：
     * 目标：最终输出的 base64 字符串不超过 200KB
     * 
     * 阶段一：初始压缩
     *   - 最大宽度：800px（超过则按比例缩放）
     *   - 初始质量：0.7
     * 
     * 阶段二：逐步降低质量（如果体积仍超标）
     *   - 每次降低 0.1，最低到 0.3
     * 
     * 阶段三：缩小图片尺寸（如果降低质量仍超标）
     *   - 每次宽度减少 100px，最低到 300px
     *   - 每次缩小尺寸后，质量重置为当前最低的 0.3 进行压缩
     * 
     * 说明：base64 编码后大小约为二进制的 1.33 倍，
     *       200KB base64 ≈ 150KB 二进制 JPEG 数据
     */
    const MAX_BASE64_SIZE = 200 * 1024;
    const MIN_QUALITY = 0.3;
    const QUALITY_STEP = 0.1;
    const MIN_WIDTH = 300;
    const WIDTH_STEP = 100;
    const INITIAL_QUALITY = 0.7;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        const origWidth = img.width;
        const origHeight = img.height;
        const aspectRatio = origWidth / origHeight;

        // 计算初始尺寸（按最大宽度等比缩放）
        let currentWidth = Math.min(origWidth, maxWidth);
        let currentHeight = currentWidth / aspectRatio;

        // 第一阶段：初始压缩 + 逐步降低质量
        let currentQuality = INITIAL_QUALITY;
        let result: string = '';

        const compressWithCurrentSettings = (): string => {
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          return canvas.toDataURL('image/jpeg', currentQuality);
        };

        // 先尝试初始质量 0.7
        result = compressWithCurrentSettings();
        if (result.length <= MAX_BASE64_SIZE) {
          resolve(result);
          return;
        }

        // 阶段二：质量从 0.6 逐步降到 0.3
        while (currentQuality > MIN_QUALITY) {
          currentQuality -= QUALITY_STEP;
          result = compressWithCurrentSettings();
          if (result.length <= MAX_BASE64_SIZE) {
            resolve(result);
            return;
          }
        }

        // 阶段三：逐步缩小宽度（每次减 100px，最低 300px），质量保持最低 0.3
        while (currentWidth > MIN_WIDTH) {
          currentWidth -= WIDTH_STEP;
          currentWidth = Math.max(currentWidth, MIN_WIDTH);
          currentHeight = currentWidth / aspectRatio;
          currentQuality = MIN_QUALITY;
          result = compressWithCurrentSettings();
          if (result.length <= MAX_BASE64_SIZE) {
            resolve(result);
            return;
          }
        }

        // 所有策略都试过仍不达标（极少见的超大图），返回最后一次压缩结果
        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
