import { CityClimate, MonthlyRecord } from '../types';

const cities = [
  { cityId: 'beijing', cityName: '北京', lat: 39.9, lng: 116.4 },
  { cityId: 'newyork', cityName: '纽约', lat: 40.7, lng: -74.0 },
  { cityId: 'london', cityName: '伦敦', lat: 51.5, lng: -0.1 },
  { cityId: 'tokyo', cityName: '东京', lat: 35.7, lng: 139.7 },
  { cityId: 'sydney', cityName: '悉尼', lat: -33.9, lng: 151.2 },
  { cityId: 'paris', cityName: '巴黎', lat: 48.9, lng: 2.3 },
  { cityId: 'moscow', cityName: '莫斯科', lat: 55.8, lng: 37.6 },
  { cityId: 'cairo', cityName: '开罗', lat: 30.0, lng: 31.2 },
  { cityId: 'mumbai', cityName: '孟买', lat: 19.1, lng: 72.9 },
  { cityId: 'rio', cityName: '里约热内卢', lat: -22.9, lng: -43.2 },
  { cityId: 'capetown', cityName: '开普敦', lat: -33.9, lng: 18.4 },
  { cityId: 'dubai', cityName: '迪拜', lat: 25.2, lng: 55.3 },
  { cityId: 'singapore', cityName: '新加坡', lat: 1.35, lng: 103.8 },
  { cityId: 'toronto', cityName: '多伦多', lat: 43.7, lng: -79.4 },
  { cityId: 'seoul', cityName: '首尔', lat: 37.6, lng: 127.0 },
  { cityId: 'berlin', cityName: '柏林', lat: 52.5, lng: 13.4 },
  { cityId: 'rome', cityName: '罗马', lat: 41.9, lng: 12.5 },
  { cityId: 'bangkok', cityName: '曼谷', lat: 13.8, lng: 100.5 },
  { cityId: 'buenosaires', cityName: '布宜诺斯艾利斯', lat: -34.6, lng: -58.4 },
  { cityId: 'jakarta', cityName: '雅加达', lat: -6.2, lng: 106.8 },
];

const baseClimatePatterns: Record<string, { temps: number[]; precips: number[] }> = {
  beijing: { temps: [-3, 0, 7, 15, 22, 26, 28, 27, 22, 14, 5, -1], precips: [3, 6, 10, 25, 45, 80, 180, 160, 50, 20, 8, 3] },
  newyork: { temps: [-1, 1, 6, 12, 18, 23, 26, 25, 21, 15, 9, 3], precips: [80, 75, 90, 95, 100, 90, 105, 100, 95, 90, 85, 85] },
  london: { temps: [5, 5, 8, 11, 15, 18, 20, 20, 17, 13, 9, 6], precips: [55, 45, 40, 45, 50, 45, 45, 50, 55, 65, 60, 55] },
  tokyo: { temps: [5, 6, 10, 15, 20, 23, 27, 28, 24, 19, 13, 8], precips: [50, 60, 100, 120, 140, 180, 150, 170, 200, 180, 100, 55] },
  sydney: { temps: [23, 23, 22, 19, 16, 13, 12, 13, 15, 18, 20, 22], precips: [100, 110, 120, 130, 140, 130, 110, 90, 70, 75, 80, 90] },
  paris: { temps: [4, 5, 9, 12, 16, 19, 22, 21, 18, 13, 8, 5], precips: [50, 45, 50, 55, 60, 50, 45, 50, 55, 60, 55, 55] },
  moscow: { temps: [-10, -8, -2, 7, 15, 19, 22, 20, 14, 6, -2, -7], precips: [35, 30, 30, 40, 55, 70, 80, 75, 60, 50, 45, 40] },
  cairo: { temps: [14, 15, 18, 23, 28, 31, 33, 33, 31, 27, 21, 16], precips: [5, 5, 3, 2, 0, 0, 0, 0, 0, 2, 3, 5] },
  mumbai: { temps: [24, 25, 28, 30, 32, 30, 28, 28, 28, 28, 27, 25], precips: [3, 2, 1, 2, 20, 450, 650, 450, 300, 60, 15, 5] },
  rio: { temps: [26, 27, 26, 24, 22, 20, 20, 21, 22, 23, 24, 26], precips: [140, 130, 130, 110, 90, 70, 60, 55, 75, 90, 110, 130] },
  capetown: { temps: [22, 22, 21, 18, 16, 14, 13, 14, 16, 18, 20, 22], precips: [15, 20, 25, 50, 80, 95, 100, 85, 55, 35, 25, 15] },
  dubai: { temps: [19, 20, 23, 28, 33, 36, 38, 38, 35, 31, 26, 21], precips: [20, 15, 10, 5, 0, 0, 0, 0, 0, 3, 8, 15] },
  singapore: { temps: [26, 26, 27, 28, 28, 28, 27, 27, 27, 27, 27, 26], precips: [180, 160, 180, 190, 190, 190, 180, 190, 180, 190, 200, 190] },
  toronto: { temps: [-4, -2, 3, 9, 15, 20, 23, 22, 18, 12, 6, -1], precips: [60, 55, 65, 70, 75, 75, 75, 80, 75, 70, 70, 65] },
  seoul: { temps: [-2, 1, 7, 13, 19, 23, 26, 27, 22, 15, 8, 1], precips: [20, 25, 45, 70, 95, 110, 300, 280, 130, 50, 40, 25] },
  berlin: { temps: [0, 1, 5, 9, 14, 17, 20, 19, 15, 10, 5, 2], precips: [40, 35, 40, 45, 55, 60, 60, 55, 50, 45, 45, 40] },
  rome: { temps: [8, 9, 12, 15, 20, 24, 27, 27, 23, 19, 14, 10], precips: [70, 75, 65, 55, 40, 20, 15, 20, 50, 75, 95, 85] },
  bangkok: { temps: [26, 28, 29, 30, 30, 29, 28, 28, 28, 28, 27, 26], precips: [10, 20, 40, 80, 200, 150, 160, 170, 270, 200, 60, 20] },
  buenosaires: { temps: [24, 23, 21, 18, 14, 11, 11, 12, 15, 18, 20, 23], precips: [110, 100, 110, 90, 80, 60, 60, 65, 75, 100, 105, 110] },
  jakarta: { temps: [26, 26, 27, 27, 27, 27, 26, 27, 27, 27, 27, 26], precips: [170, 160, 150, 170, 130, 120, 110, 110, 130, 160, 170, 180] },
};

function generateYearlyData(baseTemps: number[], basePrecips: number[], year: number): MonthlyRecord[] {
  const yearOffset = (year - 2015) * 0.15;
  const data: MonthlyRecord[] = [];
  for (let month = 0; month < 12; month++) {
    const seed = year * 100 + month;
    const noiseTemp = Math.sin(seed) * 1.2 + Math.cos(seed * 1.3) * 0.8;
    const noisePrecip = Math.abs(Math.sin(seed * 0.7)) * 25 + 5;
    data.push({
      year,
      month: month + 1,
      temperature: Math.round((baseTemps[month] + yearOffset + noiseTemp) * 10) / 10,
      precipitation: Math.max(0, Math.round(basePrecips[month] + noisePrecip)),
    });
  }
  return data;
}

export function generateClimateData(): CityClimate[] {
  return cities.map((city) => {
    const pattern = baseClimatePatterns[city.cityId];
    const allYearData: MonthlyRecord[] = [];
    for (let year = 2010; year <= 2020; year++) {
      allYearData.push(...generateYearlyData(pattern.temps, pattern.precips, year));
    }
    return {
      ...city,
      monthlyData: allYearData,
    };
  });
}

export function getMonthlyDataByYear(data: CityClimate['monthlyData'], year: number) {
  return data.filter((d) => d.year === year).sort((a, b) => a.month - b.month);
}
