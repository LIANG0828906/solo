export interface City {
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  bortle: number;
}

export const CITIES: City[] = [
  { name: '内华达暗夜保护区', nameEn: 'Nevada Dark Sky Reserve', lat: 38.0, lon: -117.0, bortle: 1 },
  { name: '雷克雅未克', nameEn: 'Reykjavik', lat: 64.1, lon: -21.9, bortle: 2 },
  { name: '拉萨', nameEn: 'Lhasa', lat: 29.6, lon: 91.1, bortle: 3 },
  { name: '开普敦', nameEn: 'Cape Town', lat: -33.9, lon: 18.4, bortle: 4 },
  { name: '悉尼', nameEn: 'Sydney', lat: -33.9, lon: 151.2, bortle: 5 },
  { name: '伦敦', nameEn: 'London', lat: 51.5, lon: -0.1, bortle: 6 },
  { name: '东京', nameEn: 'Tokyo', lat: 35.7, lon: 139.7, bortle: 7 },
  { name: '纽约', nameEn: 'New York', lat: 40.7, lon: -74.0, bortle: 8 },
  { name: '北京', nameEn: 'Beijing', lat: 39.9, lon: 116.4, bortle: 8 },
  { name: '上海', nameEn: 'Shanghai', lat: 31.2, lon: 121.5, bortle: 9 },
  { name: '香港', nameEn: 'Hong Kong', lat: 22.3, lon: 114.2, bortle: 9 },
  { name: '新加坡', nameEn: 'Singapore', lat: 1.3, lon: 103.8, bortle: 9 },
];
