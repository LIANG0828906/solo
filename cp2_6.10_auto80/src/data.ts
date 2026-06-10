import { Drink, Vessel, Shichen } from './types';

export const DRINKS: Drink[] = [
  { id: 'wine', name: '葡萄酒', unit: '斗', price: 200, stock: 100, maxStock: 100, costRatio: 0.6 },
  { id: 'sanlejiang', name: '三勒浆', unit: '杯', price: 15, stock: 100, maxStock: 100, costRatio: 0.6 },
  { id: 'longgao', name: '龙膏酒', unit: '壶', price: 300, stock: 100, maxStock: 100, costRatio: 0.6 },
  { id: 'songlao', name: '松醪春', unit: '盏', price: 50, stock: 100, maxStock: 100, costRatio: 0.6 },
];

export const VESSELS: Vessel[] = [
  { id: 'bronze', name: '青铜爵', price: 5 },
  { id: 'porcelain', name: '白瓷杯', price: 2 },
  { id: 'glass', name: '琉璃碗', price: 0 },
];

export const SHICHENS: Shichen[] = [
  { id: 'zi', name: '子时', hourRange: '23:00-01:00', priceModifier: -0.2 },
  { id: 'chou', name: '丑时', hourRange: '01:00-03:00', priceModifier: 0 },
  { id: 'yin', name: '寅时', hourRange: '03:00-05:00', priceModifier: 0 },
  { id: 'mao', name: '卯时', hourRange: '05:00-07:00', priceModifier: 0 },
  { id: 'chen', name: '辰时', hourRange: '07:00-09:00', priceModifier: 0 },
  { id: 'si', name: '巳时', hourRange: '09:00-11:00', priceModifier: 0 },
  { id: 'wu', name: '午时', hourRange: '11:00-13:00', priceModifier: 0.2 },
  { id: 'wei', name: '未时', hourRange: '13:00-15:00', priceModifier: 0 },
  { id: 'shen', name: '申时', hourRange: '15:00-17:00', priceModifier: 0 },
  { id: 'you', name: '酉时', hourRange: '17:00-19:00', priceModifier: 0 },
  { id: 'xu', name: '戌时', hourRange: '19:00-21:00', priceModifier: 0 },
  { id: 'hai', name: '亥时', hourRange: '21:00-23:00', priceModifier: 0 },
];

export const HU_NAMES = ['阿史那', '康婆', '安叱奴', '石胡', '米萨保', '何摩诃', '曹婆罗门', '安菩'];
export const HAN_NAMES = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];

export function generateCustomerName(): string {
  const isHu = Math.random() > 0.5;
  const names = isHu ? HU_NAMES : HAN_NAMES;
  return names[Math.floor(Math.random() * names.length)];
}

export function getCurrentShichen(): Shichen {
  const hour = new Date().getHours();
  const shichenIndex = ((hour + 1) % 24) >> 1;
  return SHICHENS[shichenIndex];
}
