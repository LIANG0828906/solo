export interface User {
  id: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

export interface PlanetData {
  name: string;
  degree: number;
  sign: string;
  house: number;
  longitude: number;
  annotation?: string;
}

export interface ChartData {
  id: string;
  userId: string;
  title: string;
  birthDate: string;
  birthTime: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
  planets: PlanetData[];
  houses: number[];
  annotations: Record<string, string>;
  likes: number;
  createdAt: string;
  userNickname?: string;
  userAvatar?: string;
}

export interface ChartSummary {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  title: string;
  birthDate: string;
  city: string;
  planetCount: number;
  annotationCount: number;
  likes: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  chartId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface BirthInfo {
  date: string;
  time: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type PlanetName = '太阳' | '月亮' | '水星' | '金星' | '火星' | '木星' | '土星' | '天王星' | '海王星' | '冥王星';
export type ZodiacSign = '白羊座' | '金牛座' | '双子座' | '巨蟹座' | '狮子座' | '处女座' | '天秤座' | '天蝎座' | '射手座' | '摩羯座' | '水瓶座' | '双鱼座';

export const PLANET_COLORS: Record<string, string> = {
  '太阳': '#FFD700',
  '月亮': '#C0C0C0',
  '水星': '#87CEEB',
  '金星': '#FFB6C1',
  '火星': '#FF4500',
  '木星': '#DAA520',
  '土星': '#F4A460',
  '天王星': '#40E0D0',
  '海王星': '#4169E1',
  '冥王星': '#8B0000',
};

export const ZODIAC_COLORS: Record<string, string> = {
  '白羊座': '#FF6B6B',
  '金牛座': '#95E1D3',
  '双子座': '#F38181',
  '巨蟹座': '#AA96DA',
  '狮子座': '#FCBAD3',
  '处女座': '#A8D8EA',
  '天秤座': '#FFD3B6',
  '天蝎座': '#FFAAA5',
  '射手座': '#A8E6CF',
  '摩羯座': '#DCEDC1',
  '水瓶座': '#FFD3B6',
  '双鱼座': '#FFAAA5',
};

export const ZODIAC_SYMBOLS: Record<string, string> = {
  '白羊座': '♈',
  '金牛座': '♉',
  '双子座': '♊',
  '巨蟹座': '♋',
  '狮子座': '♌',
  '处女座': '♍',
  '天秤座': '♎',
  '天蝎座': '♏',
  '射手座': '♐',
  '摩羯座': '♑',
  '水瓶座': '♒',
  '双鱼座': '♓',
};
