import type { Theme, ThemeId } from '@/types';

export const themes: Record<ThemeId, Theme> = {
  orange: {
    id: 'orange',
    name: '暖阳橙',
    primaryColor: '#E17055',
    bgColors: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
  },
  green: {
    id: 'green',
    name: '森系绿',
    primaryColor: '#00B894',
    bgColors: ['#E8F5E9', '#C8E6C9', '#A5D6A7'],
  },
  blue: {
    id: 'blue',
    name: '海洋蓝',
    primaryColor: '#0984E3',
    bgColors: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
  },
  pink: {
    id: 'pink',
    name: '樱花粉',
    primaryColor: '#E84393',
    bgColors: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
  },
};

export const themeList: Theme[] = Object.values(themes);

export function getTheme(id: ThemeId): Theme {
  return themes[id] || themes.orange;
}
