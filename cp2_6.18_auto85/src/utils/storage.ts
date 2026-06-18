import { Exhibition, WorkMaterial, WallPlacement } from '@/types';

const STORAGE_KEYS = {
  EXHIBITIONS: 'va_exhibitions',
  WORKS: 'va_works',
  PLACEMENTS: 'va_placements',
};

export const loadExhibitions = (): Exhibition[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXHIBITIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveExhibitions = (exhibitions: Exhibition[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXHIBITIONS, JSON.stringify(exhibitions));
  } catch (e) {
    console.error('Failed to save exhibitions:', e);
  }
};

export const loadWorkMaterials = (): WorkMaterial[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWorkMaterials = (works: WorkMaterial[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(works));
  } catch (e) {
    console.error('Failed to save works:', e);
  }
};

export const loadWallPlacements = (): WallPlacement[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLACEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWallPlacements = (placements: WallPlacement[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLACEMENTS, JSON.stringify(placements));
  } catch (e) {
    console.error('Failed to save placements:', e);
  }
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('文件大小超过5MB限制'));
      return;
    }
    if (!/image\/(jpeg|png)/i.test(file.type)) {
      reject(new Error('仅支持JPG/PNG格式'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = url;
  });
};
