import { v4 as uuidv4 } from 'uuid';
import type { Plant, Photo, HealthStatus } from '../types';

const moods = ['😊 开心', '🌱 期待', '💪 加油', '🥰 喜爱', '☀️ 阳光', '🌿 平静', '🤗 满足', '✨ 惊喜'];

const generatePhotoPrompt = (plantType: string, day: number): string => {
  const encoded = encodeURIComponent(`a ${plantType} plant, day ${day} of growth, natural lighting, houseplant, potted plant, high quality photo`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=square`;
};

const createMockPlant = (
  name: string,
  variety: string,
  daysAgo: number,
  healthStatus: HealthStatus,
  isFavorite: boolean,
  photoCount: number
): { plant: Plant; photos: Photo[] } => {
  const plantId = uuidv4();
  const plantDate = new Date();
  plantDate.setDate(plantDate.getDate() - daysAgo);
  
  const photos: Photo[] = [];
  const interval = Math.floor(daysAgo / Math.max(photoCount, 1));
  
  for (let i = 0; i < photoCount; i++) {
    const photoDate = new Date(plantDate);
    photoDate.setDate(photoDate.getDate() + i * interval + Math.floor(Math.random() * interval));
    
    const photoId = uuidv4();
    photos.push({
      id: photoId,
      plantId,
      imageUrl: generatePhotoPrompt(variety, i * interval),
      date: photoDate.toISOString(),
      note: getRandomNote(i, photoCount),
      mood: moods[Math.floor(Math.random() * moods.length)],
      createdAt: photoDate.toISOString()
    });
  }
  
  const latestPhoto = photos[photos.length - 1];
  
  const plant: Plant = {
    id: plantId,
    name,
    variety,
    plantDate: plantDate.toISOString(),
    coverPhoto: latestPhoto?.imageUrl || generatePhotoPrompt(variety, 0),
    healthStatus,
    isFavorite,
    createdAt: plantDate.toISOString(),
    updatedAt: latestPhoto?.createdAt || new Date().toISOString()
  };
  
  return { plant, photos };
};

const getRandomNote = (index: number, total: number): string => {
  const notes = [
    '今天冒出了第一片小嫩芽，太可爱了！',
    '叶片明显长大了，颜色也更绿了',
    '给它浇了水，松了松土，看起来精神很好',
    '发现了一片新叶子正在展开',
    '今天阳光很好，搬出去晒了晒太阳',
    '施了一点薄肥，希望它能茁壮成长',
    '植株越来越茂盛了，很有成就感',
    '今天发现了小花苞！期待开花',
    '花朵终于开了，太美了！',
    '给它换了个大一点的花盆，根系长得很好'
  ];
  
  if (index === 0) return '刚种下的小苗，要好好照顾哦~';
  if (index === total - 1) return notes[notes.length - 1];
  return notes[Math.floor(Math.random() * (notes.length - 2)) + 1];
};

export const generateMockData = (): { plants: Plant[]; photos: Photo[] } => {
  const mockPlants: { plant: Plant; photos: Photo[] }[] = [
    createMockPlant('小绿', '绿萝', 45, 'healthy', true, 6),
    createMockPlant('肉肉', '多肉植物', 90, 'normal', false, 5),
    createMockPlant('太阳', '向日葵', 30, 'healthy', true, 4),
    createMockPlant('香香', '薄荷', 60, 'attention', false, 5),
    createMockPlant('仙子', '水仙花', 15, 'healthy', false, 3)
  ];
  
  return {
    plants: mockPlants.map(m => m.plant),
    photos: mockPlants.flatMap(m => m.photos)
  };
};
