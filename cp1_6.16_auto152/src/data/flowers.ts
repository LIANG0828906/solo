import type { FlowerItem, WrappingOption, RibbonOption } from '@/types';

export const FLOWERS: FlowerItem[] = [
  { id: 'rose', name: '玫瑰', price: 12, thumbnail: '🌹', petalColor: '#E84057', stemColor: '#4A7C4A', centerColor: '#FFD700' },
  { id: 'lily', name: '百合', price: 15, thumbnail: '�百合', petalColor: '#FFF8F0', stemColor: '#4A7C4A', centerColor: '#FFB347' },
  { id: 'hydrangea', name: '绣球', price: 18, thumbnail: '💐', petalColor: '#9B72CF', stemColor: '#4A7C4A', centerColor: '#E8D5F5' },
  { id: 'sunflower', name: '向日葵', price: 10, thumbnail: '🌻', petalColor: '#FFD700', stemColor: '#4A7C4A', centerColor: '#8B4513' },
  { id: 'tulip', name: '郁金香', price: 14, thumbnail: '🌷', petalColor: '#FF6B81', stemColor: '#4A7C4A', centerColor: '#FFE4B5' },
  { id: 'carnation', name: '康乃馨', price: 11, thumbnail: '🌸', petalColor: '#FF69B4', stemColor: '#4A7C4A', centerColor: '#DC143C' },
  { id: 'peony', name: '芍药', price: 20, thumbnail: '🏵️', petalColor: '#FFB6C1', stemColor: '#4A7C4A', centerColor: '#FFDAB9' },
  { id: 'lavender', name: '薰衣草', price: 9, thumbnail: '💜', petalColor: '#9370DB', stemColor: '#4A7C4A', centerColor: '#DDA0DD' },
];

export const WRAPPING_OPTIONS: WrappingOption[] = [
  { id: 'plain-white', name: '素白', color: '#FFFFFF', secondaryColor: '#F5F5F0' },
  { id: 'gradient-pink', name: '渐变粉', color: '#FFB6C1', secondaryColor: '#FFC0CB' },
  { id: 'vintage-brown', name: '复古棕', color: '#A0826D', secondaryColor: '#C4A882' },
  { id: 'forest-green', name: '墨绿', color: '#2E5A3E', secondaryColor: '#3D7A52' },
  { id: 'starry-blue', name: '星空蓝', color: '#1A237E', secondaryColor: '#3949AB' },
];

export const RIBBON_OPTIONS: RibbonOption[] = [
  { id: 'gold', name: '金色', color: '#D4AF37' },
  { id: 'silver', name: '银色', color: '#C0C0C0' },
  { id: 'red', name: '红色', color: '#CC3333' },
  { id: 'beige', name: '米色', color: '#F5F0E1' },
];

export const WRAPPING_PRICE = 15;
export const RIBBON_PRICE = 5;
