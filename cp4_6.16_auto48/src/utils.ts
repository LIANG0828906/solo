import { format, differenceInDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { PlantRecord, RecordGroup, RecordType } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const compressImage = async (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
  const base64 = await fileToBase64(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(base64);
        return;
      }
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

export const formatDateLabel = (timestamp: number): string => {
  return format(timestamp, 'M月d日 EEEE', { locale: zhCN });
};

export const formatDateKey = (timestamp: number): string => {
  return format(timestamp, 'yyyy-MM-dd');
};

export const groupRecordsByDate = (records: PlantRecord[]): RecordGroup[] => {
  const map = new Map<string, RecordGroup>();
  const sorted = [...records].sort((a, b) => b.date - a.date);

  for (const record of sorted) {
    const key = formatDateKey(record.date);
    if (!map.has(key)) {
      map.set(key, {
        dateKey: key,
        dateLabel: formatDateLabel(record.date),
        records: [],
      });
    }
    map.get(key)!.records.push(record);
  }

  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
};

export const RECORD_META: Record<RecordType, { label: string; icon: string; color: string }> = {
  water: { label: '浇水', icon: '💧', color: '#6BB3D9' },
  fertilize: { label: '施肥', icon: '🌱', color: '#86C8BC' },
  prune: { label: '修剪', icon: '✂️', color: '#E8A87C' },
  repot: { label: '换盆', icon: '🪴', color: '#C9A66B' },
  photo: { label: '拍照', icon: '📷', color: '#B58AD8' },
};

export const getDaysUntilWatering = (plant: { waterFrequency: number; id: string }, allRecords: PlantRecord[]): number => {
  const waterRecords = allRecords.filter(r => r.plantId === plant.id && r.type === 'water');
  if (waterRecords.length === 0) return 0;
  const lastWater = Math.max(...waterRecords.map(r => r.date));
  const nextWater = lastWater + plant.waterFrequency * 24 * 60 * 60 * 1000;
  const days = differenceInDays(startOfDay(nextWater), startOfDay(Date.now()));
  return days;
};

export const getDaysAlive = (createdAt: number): number => {
  return Math.max(0, differenceInDays(startOfDay(Date.now()), startOfDay(createdAt)) + 1);
};
