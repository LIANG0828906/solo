export interface Activity {
  id: string;
  name: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  routeImages: string[];
  maxMembers: number;
  location: string;
  registrationCount?: number;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'tent' | 'sleeping_bag' | 'cookware' | 'first_aid';
  totalStock: number;
  allocated: number;
}

export interface Registration {
  id: string;
  activityId: string;
  memberName: string;
  phone: string;
  equipmentIds: string[];
  createdAt: string;
}

export interface WeatherForecast {
  date: string;
  icon: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  tempHigh: number;
  tempLow: number;
  precipitation: number;
}

export type Difficulty = Activity['difficulty'];
export type EquipmentCategory = Equipment['category'];
export type WeatherIcon = WeatherForecast['icon'];

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  tent: '帐篷',
  sleeping_bag: '睡袋',
  cookware: '炊具',
  first_aid: '急救包',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '轻松',
  medium: '中等',
  hard: '困难',
};

export const WEATHER_ICON_LABELS: Record<WeatherIcon, string> = {
  sunny: '晴',
  cloudy: '多云',
  rainy: '雨',
  stormy: '暴风雨',
  snowy: '雪',
};
