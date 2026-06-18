import { Collection } from '../types';

export const collections: Collection[] = [
  {
    id: 'spring-garden',
    name: '春季花园',
    description: '灵感来自春日花园的柔美与生机，采用轻盈面料与柔和粉绿色调，诠释自然之美。',
    theme: 'spring',
    themeColors: ['#FFB6C1', '#98FB98'],
    thumbnailUrl: 'spring-garden'
  },
  {
    id: 'urban-minimal',
    name: '都市极简',
    description: '现代都市风格的极简设计，干净利落的剪裁与高级灰调配色，彰显都市女性的独立与优雅。',
    theme: 'urban',
    themeColors: ['#F5F5F5', '#4A4A4A'],
    thumbnailUrl: 'urban-minimal'
  },
  {
    id: 'coastal-breeze',
    name: '海岸晚风',
    description: '地中海海岸的浪漫风情，蓝紫色调与飘逸面料，仿佛海风轻拂，带来宁静与自由。',
    theme: 'coastal',
    themeColors: ['#87CEEB', '#9370DB'],
    thumbnailUrl: 'coastal-breeze'
  }
];

export const getCollectionById = (id: string): Collection | undefined => {
  return collections.find(c => c.id === id);
};
