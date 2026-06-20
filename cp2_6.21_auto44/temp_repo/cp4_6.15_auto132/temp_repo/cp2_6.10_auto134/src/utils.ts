import type { TimeOfDay } from './types';

const SHICHEN = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
];

export const getTangTime = (timestamp: number): TimeOfDay => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  const shichenIndex = Math.floor((hour + 1) % 24 / 2);
  const shichen = SHICHEN[shichenIndex];
  
  const minutesInShichen = ((hour % 2) * 60 + minute);
  const ke = Math.floor(minutesInShichen / 15) + 1;
  
  return {
    hour,
    minute,
    shichen,
    ke
  };
};

export const formatTangTime = (timestamp: number): string => {
  const t = getTangTime(timestamp);
  return `${t.shichen}${t.ke}刻`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const calculateTax = (amount: number, rate: number = 0.02): number => {
  return Math.round(amount * rate);
};

export const convertToCopper = (amount: number, rate: number): number => {
  return Math.round(amount * rate);
};

export const convertFromCopper = (copperAmount: number, rate: number): number => {
  return Math.round((copperAmount / rate) * 100) / 100;
};
