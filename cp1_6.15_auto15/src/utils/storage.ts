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

export const compressImage = (file: File, maxWidth: number = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
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
