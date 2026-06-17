import { v4 as uuidv4 } from 'uuid';
import type { VinylRecord, CoverStyle, CoverKeyword } from '../types';

const darkColors = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d2d44', '#3d2c5c', '#4a1942', '#1e3a5f',
  '#2c3e50', '#34495e', '#2c3639', '#3f4e4f',
  '#1e272e', '#474747', '#3d3d3d', '#2c2c54',
  '#40407a', '#2f3542', '#574b90', '#30336b'
];

const genres = ['爵士', '电子', '民谣', '古典', '摇滚', '蓝调', '灵魂', '放克', '独立', '后摇', 'R&B', '嘻哈'];

const coverStyles: CoverStyle[] = ['爵士暖调', '电子冷感', '民谣清新', '古典典雅'];
const coverKeywords: CoverKeyword[] = ['慵懒', '深邃', '明亮', '忧郁'];

const records: Array<{ title: string; artist: string; genre: string; year: number }> = [
  { title: '午夜蓝调', artist: '李明轩', genre: '爵士', year: 1965 },
  { title: '霓虹梦境', artist: 'Cyber Wave', genre: '电子', year: 2018 },
  { title: '山间回响', artist: '陈雨柔', genre: '民谣', year: 1972 },
  { title: '月光奏鸣曲', artist: '维也纳交响乐团', genre: '古典', year: 1960 },
  { title: '叛逆年代', artist: '暴风乐队', genre: '摇滚', year: 1989 },
  { title: '灵魂深处', artist: '艾瑞莎·杰克逊', genre: '灵魂', year: 1978 },
  { title: '城市节拍', artist: 'The Funky Machines', genre: '放克', year: 1995 },
  { title: '雨后彩虹', artist: '林小雨', genre: '独立', year: 2021 },
  { title: '时间的灰烬', artist: '寂静之夜', genre: '后摇', year: 2005 },
  { title: '午夜倾诉', artist: '詹姆斯·布朗', genre: 'R&B', year: 1982 },
  { title: '街头诗人', artist: 'MC Flow', genre: '嘻哈', year: 2015 },
  { title: '蓝调咖啡馆', artist: '老汤姆', genre: '蓝调', year: 1998 }
];

const getRandomColor = (): string => {
  return darkColors[Math.floor(Math.random() * darkColors.length)];
};

const getRandomDuration = (): number => {
  return Math.floor(Math.random() * (360 - 180 + 1)) + 180;
};

const getRandomStyle = (): CoverStyle => {
  return coverStyles[Math.floor(Math.random() * coverStyles.length)];
};

const getRandomKeyword = (): CoverKeyword => {
  return coverKeywords[Math.floor(Math.random() * coverKeywords.length)];
};

export const mockRecords: VinylRecord[] = records.map(record => ({
  id: uuidv4(),
  title: record.title,
  artist: record.artist,
  year: record.year,
  coverColor: getRandomColor(),
  genre: record.genre,
  coverUrl: '',
  audioUrl: '',
  duration: getRandomDuration(),
  style: getRandomStyle(),
  keyword: getRandomKeyword()
}));
