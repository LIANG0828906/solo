import { CityData, ClimateRecord, EventType, Continent, HeatmapPoint } from '../types/DataTypes';
import { eventBus } from '../event/EventBus';

const CITIES_TEMPLATE = [
  { name: '北京', country: '中国', continent: 'asia', lat: 39.9042, lon: 116.4074, baseAqi: 95, basePm25: 70, baseTemp: 12, baseHumidity: 55 },
  { name: '上海', country: '中国', continent: 'asia', lat: 31.2304, lon: 121.4737, baseAqi: 75, basePm25: 55, baseTemp: 16, baseHumidity: 70 },
  { name: '广州', country: '中国', continent: 'asia', lat: 23.1291, lon: 113.2644, baseAqi: 65, basePm25: 45, baseTemp: 22, baseHumidity: 75 },
  { name: '深圳', country: '中国', continent: 'asia', lat: 22.5431, lon: 114.0579, baseAqi: 60, basePm25: 40, baseTemp: 23, baseHumidity: 72 },
  { name: '成都', country: '中国', continent: 'asia', lat: 30.5728, lon: 104.0668, baseAqi: 85, basePm25: 65, baseTemp: 16, baseHumidity: 70 },
  { name: '杭州', country: '中国', continent: 'asia', lat: 30.2741, lon: 120.1551, baseAqi: 70, basePm25: 50, baseTemp: 17, baseHumidity: 68 },
  { name: '武汉', country: '中国', continent: 'asia', lat: 30.5928, lon: 114.3055, baseAqi: 80, basePm25: 60, baseTemp: 17, baseHumidity: 65 },
  { name: '西安', country: '中国', continent: 'asia', lat: 34.3416, lon: 108.9398, baseAqi: 90, basePm25: 75, baseTemp: 14, baseHumidity: 60 },
  { name: '南京', country: '中国', continent: 'asia', lat: 32.0603, lon: 118.7969, baseAqi: 72, basePm25: 52, baseTemp: 16, baseHumidity: 68 },
  { name: '重庆', country: '中国', continent: 'asia', lat: 29.4316, lon: 106.9123, baseAqi: 78, basePm25: 58, baseTemp: 18, baseHumidity: 70 },
  { name: '东京', country: '日本', continent: 'asia', lat: 35.6762, lon: 139.6503, baseAqi: 45, basePm25: 30, baseTemp: 16, baseHumidity: 65 },
  { name: '大阪', country: '日本', continent: 'asia', lat: 34.6937, lon: 135.5022, baseAqi: 48, basePm25: 32, baseTemp: 17, baseHumidity: 62 },
  { name: '首尔', country: '韩国', continent: 'asia', lat: 37.5665, lon: 126.9780, baseAqi: 55, basePm25: 40, baseTemp: 12, baseHumidity: 60 },
  { name: '新加坡', country: '新加坡', continent: 'asia', lat: 1.3521, lon: 103.8198, baseAqi: 40, basePm25: 25, baseTemp: 27, baseHumidity: 80 },
  { name: '曼谷', country: '泰国', continent: 'asia', lat: 13.7563, lon: 100.5018, baseAqi: 52, basePm25: 38, baseTemp: 28, baseHumidity: 75 },
  { name: '吉隆坡', country: '马来西亚', continent: 'asia', lat: 3.1390, lon: 101.6869, baseAqi: 48, basePm25: 35, baseTemp: 27, baseHumidity: 78 },
  { name: '雅加达', country: '印度尼西亚', continent: 'asia', lat: -6.2088, lon: 106.8456, baseAqi: 58, basePm25: 42, baseTemp: 27, baseHumidity: 80 },
  { name: '马尼拉', country: '菲律宾', continent: 'asia', lat: 14.5995, lon: 120.9842, baseAqi: 50, basePm25: 36, baseTemp: 27, baseHumidity: 75 },
  { name: '新德里', country: '印度', continent: 'asia', lat: 28.6139, lon: 77.2090, baseAqi: 150, basePm25: 120, baseTemp: 25, baseHumidity: 55 },
  { name: '孟买', country: '印度', continent: 'asia', lat: 19.0760, lon: 72.8777, baseAqi: 120, basePm25: 95, baseTemp: 27, baseHumidity: 65 },
  { name: '加尔各答', country: '印度', continent: 'asia', lat: 22.5726, lon: 88.3639, baseAqi: 130, basePm25: 105, baseTemp: 26, baseHumidity: 70 },
  { name: '卡拉奇', country: '巴基斯坦', continent: 'asia', lat: 24.8607, lon: 67.0011, baseAqi: 110, basePm25: 85, baseTemp: 26, baseHumidity: 60 },
  { name: '伊斯坦布尔', country: '土耳其', continent: 'asia', lat: 41.0082, lon: 28.9784, baseAqi: 65, basePm25: 48, baseTemp: 15, baseHumidity: 65 },
  { name: '德黑兰', country: '伊朗', continent: 'asia', lat: 35.6892, lon: 51.3890, baseAqi: 100, basePm25: 80, baseTemp: 17, baseHumidity: 50 },
  { name: '利雅得', country: '沙特阿拉伯', continent: 'asia', lat: 24.7136, lon: 46.6753, baseAqi: 85, basePm25: 65, baseTemp: 26, baseHumidity: 35 },
  { name: '迪拜', country: '阿联酋', continent: 'asia', lat: 25.2048, lon: 55.2708, baseAqi: 70, basePm25: 52, baseTemp: 27, baseHumidity: 55 },
  { name: '伦敦', country: '英国', continent: 'europe', lat: 51.5074, lon: -0.1278, baseAqi: 35, basePm25: 22, baseTemp: 12, baseHumidity: 70 },
  { name: '巴黎', country: '法国', continent: 'europe', lat: 48.8566, lon: 2.3522, baseAqi: 40, basePm25: 28, baseTemp: 12, baseHumidity: 68 },
  { name: '柏林', country: '德国', continent: 'europe', lat: 52.5200, lon: 13.4050, baseAqi: 38, basePm25: 25, baseTemp: 10, baseHumidity: 65 },
  { name: '罗马', country: '意大利', continent: 'europe', lat: 41.9028, lon: 12.4964, baseAqi: 42, basePm25: 30, baseTemp: 15, baseHumidity: 62 },
  { name: '马德里', country: '西班牙', continent: 'europe', lat: 40.4168, lon: -3.7038, baseAqi: 38, basePm25: 26, baseTemp: 15, baseHumidity: 58 },
  { name: '阿姆斯特丹', country: '荷兰', continent: 'europe', lat: 52.3676, lon: 4.9041, baseAqi: 32, basePm25: 20, baseTemp: 11, baseHumidity: 72 },
  { name: '布鲁塞尔', country: '比利时', continent: 'europe', lat: 50.8503, lon: 4.3517, baseAqi: 36, basePm25: 24, baseTemp: 11, baseHumidity: 70 },
  { name: '维也纳', country: '奥地利', continent: 'europe', lat: 48.2082, lon: 16.3738, baseAqi: 30, basePm25: 18, baseTemp: 10, baseHumidity: 68 },
  { name: '华沙', country: '波兰', continent: 'europe', lat: 52.2297, lon: 21.0122, baseAqi: 48, basePm25: 35, baseTemp: 8, baseHumidity: 65 },
  { name: '布达佩斯', country: '匈牙利', continent: 'europe', lat: 47.4979, lon: 19.0402, baseAqi: 45, basePm25: 32, baseTemp: 11, baseHumidity: 62 },
  { name: '布拉格', country: '捷克', continent: 'europe', lat: 50.0755, lon: 14.4378, baseAqi: 40, basePm25: 28, baseTemp: 9, baseHumidity: 65 },
  { name: '斯德哥尔摩', country: '瑞典', continent: 'europe', lat: 59.3293, lon: 18.0686, baseAqi: 25, basePm25: 15, baseTemp: 7, baseHumidity: 70 },
  { name: '奥斯陆', country: '挪威', continent: 'europe', lat: 59.9139, lon: 10.7522, baseAqi: 28, basePm25: 18, baseTemp: 7, baseHumidity: 68 },
  { name: '哥本哈根', country: '丹麦', continent: 'europe', lat: 55.6761, lon: 12.5683, baseAqi: 30, basePm25: 20, baseTemp: 9, baseHumidity: 70 },
  { name: '赫尔辛基', country: '芬兰', continent: 'europe', lat: 60.1699, lon: 24.9384, baseAqi: 22, basePm25: 12, baseTemp: 6, baseHumidity: 68 },
  { name: '雅典', country: '希腊', continent: 'europe', lat: 37.9838, lon: 23.7275, baseAqi: 50, basePm25: 38, baseTemp: 18, baseHumidity: 55 },
  { name: '里斯本', country: '葡萄牙', continent: 'europe', lat: 38.7223, lon: -9.1393, baseAqi: 35, basePm25: 24, baseTemp: 17, baseHumidity: 65 },
  { name: '莫斯科', country: '俄罗斯', continent: 'europe', lat: 55.7558, lon: 37.6173, baseAqi: 55, basePm25: 42, baseTemp: 6, baseHumidity: 60 },
  { name: '圣彼得堡', country: '俄罗斯', continent: 'europe', lat: 59.9311, lon: 30.3609, baseAqi: 48, basePm25: 36, baseTemp: 6, baseHumidity: 65 },
  { name: '纽约', country: '美国', continent: 'northAmerica', lat: 40.7128, lon: -74.0060, baseAqi: 50, basePm25: 35, baseTemp: 13, baseHumidity: 65 },
  { name: '洛杉矶', country: '美国', continent: 'northAmerica', lat: 34.0522, lon: -118.2437, baseAqi: 65, basePm25: 48, baseTemp: 18, baseHumidity: 60 },
  { name: '芝加哥', country: '美国', continent: 'northAmerica', lat: 41.8781, lon: -87.6298, baseAqi: 48, basePm25: 34, baseTemp: 10, baseHumidity: 62 },
  { name: '休斯顿', country: '美国', continent: 'northAmerica', lat: 29.7604, lon: -95.3698, baseAqi: 52, basePm25: 38, baseTemp: 21, baseHumidity: 65 },
  { name: '凤凰城', country: '美国', continent: 'northAmerica', lat: 33.4484, lon: -112.0740, baseAqi: 55, basePm25: 40, baseTemp: 24, baseHumidity: 40 },
  { name: '费城', country: '美国', continent: 'northAmerica', lat: 39.9526, lon: -75.1652, baseAqi: 48, basePm25: 34, baseTemp: 13, baseHumidity: 65 },
  { name: '圣安东尼奥', country: '美国', continent: 'northAmerica', lat: 29.4241, lon: -98.4936, baseAqi: 45, basePm25: 32, baseTemp: 21, baseHumidity: 60 },
  { name: '圣地亚哥', country: '美国', continent: 'northAmerica', lat: 32.7157, lon: -117.1611, baseAqi: 50, basePm25: 36, baseTemp: 18, baseHumidity: 65 },
  { name: '达拉斯', country: '美国', continent: 'northAmerica', lat: 32.7767, lon: -96.7970, baseAqi: 48, basePm25: 34, baseTemp: 19, baseHumidity: 58 },
  { name: '旧金山', country: '美国', continent: 'northAmerica', lat: 37.7749, lon: -122.4194, baseAqi: 45, basePm25: 32, baseTemp: 15, baseHumidity: 72 },
  { name: '多伦多', country: '加拿大', continent: 'northAmerica', lat: 43.6532, lon: -79.3832, baseAqi: 42, basePm25: 28, baseTemp: 9, baseHumidity: 65 },
  { name: '温哥华', country: '加拿大', continent: 'northAmerica', lat: 49.2827, lon: -123.1207, baseAqi: 35, basePm25: 22, baseTemp: 11, baseHumidity: 70 },
  { name: '蒙特利尔', country: '加拿大', continent: 'northAmerica', lat: 45.5017, lon: -73.5673, baseAqi: 38, basePm25: 25, baseTemp: 7, baseHumidity: 65 },
  { name: '卡尔加里', country: '加拿大', continent: 'northAmerica', lat: 51.0447, lon: -114.0719, baseAqi: 30, basePm25: 18, baseTemp: 5, baseHumidity: 55 },
  { name: '墨西哥城', country: '墨西哥', continent: 'northAmerica', lat: 19.4326, lon: -99.1332, baseAqi: 110, basePm25: 85, baseTemp: 18, baseHumidity: 55 },
  { name: '瓜达拉哈拉', country: '墨西哥', continent: 'northAmerica', lat: 20.6597, lon: -103.3496, baseAqi: 85, basePm25: 65, baseTemp: 20, baseHumidity: 55 },
  { name: '圣保罗', country: '巴西', continent: 'southAmerica', lat: -23.5505, lon: -46.6333, baseAqi: 58, basePm25: 42, baseTemp: 20, baseHumidity: 70 },
  { name: '里约热内卢', country: '巴西', continent: 'southAmerica', lat: -22.9068, lon: -43.1729, baseAqi: 45, basePm25: 32, baseTemp: 24, baseHumidity: 75 },
  { name: '布宜诺斯艾利斯', country: '阿根廷', continent: 'southAmerica', lat: -34.6037, lon: -58.3816, baseAqi: 38, basePm25: 26, baseTemp: 18, baseHumidity: 65 },
  { name: '圣地亚哥', country: '智利', continent: 'southAmerica', lat: -33.4489, lon: -70.6693, baseAqi: 48, basePm25: 36, baseTemp: 15, baseHumidity: 65 },
  { name: '利马', country: '秘鲁', continent: 'southAmerica', lat: -12.0464, lon: -77.0428, baseAqi: 52, basePm25: 38, baseTemp: 19, baseHumidity: 78 },
  { name: '波哥大', country: '哥伦比亚', continent: 'southAmerica', lat: 4.7110, lon: -74.0721, baseAqi: 55, basePm25: 40, baseTemp: 14, baseHumidity: 75 },
  { name: '加拉加斯', country: '委内瑞拉', continent: 'southAmerica', lat: 10.4806, lon: -66.9036, baseAqi: 45, basePm25: 32, baseTemp: 22, baseHumidity: 72 },
  { name: '基多', country: '厄瓜多尔', continent: 'southAmerica', lat: -0.1807, lon: -78.4678, baseAqi: 38, basePm25: 26, baseTemp: 14, baseHumidity: 75 },
  { name: '拉巴斯', country: '玻利维亚', continent: 'southAmerica', lat: -16.4897, lon: -68.1193, baseAqi: 40, basePm25: 28, baseTemp: 9, baseHumidity: 60 },
  { name: '亚松森', country: '巴拉圭', continent: 'southAmerica', lat: -25.2637, lon: -57.5759, baseAqi: 35, basePm25: 24, baseTemp: 22, baseHumidity: 70 },
  { name: '蒙得维的亚', country: '乌拉圭', continent: 'southAmerica', lat: -34.9011, lon: -56.1645, baseAqi: 32, basePm25: 20, baseTemp: 17, baseHumidity: 70 },
  { name: '开罗', country: '埃及', continent: 'africa', lat: 30.0444, lon: 31.2357, baseAqi: 95, basePm25: 75, baseTemp: 22, baseHumidity: 50 },
  { name: '约翰内斯堡', country: '南非', continent: 'africa', lat: -26.2041, lon: 28.0473, baseAqi: 45, basePm25: 32, baseTemp: 16, baseHumidity: 55 },
  { name: '开普敦', country: '南非', continent: 'africa', lat: -33.9249, lon: 18.4241, baseAqi: 38, basePm25: 26, baseTemp: 17, baseHumidity: 62 },
  { name: '拉各斯', country: '尼日利亚', continent: 'africa', lat: 6.5244, lon: 3.3792, baseAqi: 68, basePm25: 52, baseTemp: 27, baseHumidity: 80 },
  { name: '内罗毕', country: '肯尼亚', continent: 'africa', lat: -1.2921, lon: 36.8219, baseAqi: 55, basePm25: 40, baseTemp: 18, baseHumidity: 65 },
  { name: '卡萨布兰卡', country: '摩洛哥', continent: 'africa', lat: 33.5731, lon: -7.5898, baseAqi: 52, basePm25: 38, baseTemp: 18, baseHumidity: 65 },
  { name: '阿尔及尔', country: '阿尔及利亚', continent: 'africa', lat: 36.7538, lon: 3.0588, baseAqi: 58, basePm25: 42, baseTemp: 18, baseHumidity: 60 },
  { name: '突尼斯', country: '突尼斯', continent: 'africa', lat: 36.8065, lon: 10.1815, baseAqi: 50, basePm25: 36, baseTemp: 19, baseHumidity: 62 },
  { name: '喀土穆', country: '苏丹', continent: 'africa', lat: 15.5007, lon: 32.5599, baseAqi: 78, basePm25: 62, baseTemp: 29, baseHumidity: 40 },
  { name: '亚的斯亚贝巴', country: '埃塞俄比亚', continent: 'africa', lat: 9.03, lon: 38.74, baseAqi: 48, basePm25: 35, baseTemp: 16, baseHumidity: 55 },
  { name: '达累斯萨拉姆', country: '坦桑尼亚', continent: 'africa', lat: -6.7924, lon: 39.2083, baseAqi: 42, basePm25: 30, baseTemp: 26, baseHumidity: 75 },
  { name: '阿比让', country: '科特迪瓦', continent: 'africa', lat: 5.3204, lon: -4.0168, baseAqi: 45, basePm25: 32, baseTemp: 26, baseHumidity: 80 },
  { name: '悉尼', country: '澳大利亚', continent: 'oceania', lat: -33.8688, lon: 151.2093, baseAqi: 35, basePm25: 22, baseTemp: 18, baseHumidity: 65 },
  { name: '墨尔本', country: '澳大利亚', continent: 'oceania', lat: -37.8136, lon: 144.9631, baseAqi: 32, basePm25: 20, baseTemp: 15, baseHumidity: 65 },
  { name: '布里斯班', country: '澳大利亚', continent: 'oceania', lat: -27.4698, lon: 153.0251, baseAqi: 30, basePm25: 18, baseTemp: 21, baseHumidity: 65 },
  { name: '珀斯', country: '澳大利亚', continent: 'oceania', lat: -31.9505, lon: 115.8605, baseAqi: 28, basePm25: 16, baseTemp: 19, baseHumidity: 58 },
  { name: '阿德莱德', country: '澳大利亚', continent: 'oceania', lat: -34.9285, lon: 138.6007, baseAqi: 30, basePm25: 18, baseTemp: 17, baseHumidity: 60 },
  { name: '奥克兰', country: '新西兰', continent: 'oceania', lat: -36.8485, lon: 174.7633, baseAqi: 25, basePm25: 14, baseTemp: 15, baseHumidity: 70 },
  { name: '惠灵顿', country: '新西兰', continent: 'oceania', lat: -41.2865, lon: 174.7762, baseAqi: 22, basePm25: 12, baseTemp: 13, baseHumidity: 72 },
  { name: '基督城', country: '新西兰', continent: 'oceania', lat: -43.5321, lon: 172.6362, baseAqi: 20, basePm25: 10, baseTemp: 12, baseHumidity: 68 },
  { name: '火奴鲁鲁', country: '美国', continent: 'oceania', lat: 21.3069, lon: -157.8583, baseAqi: 28, basePm25: 15, baseTemp: 25, baseHumidity: 70 },
  { name: '苏瓦', country: '斐济', continent: 'oceania', lat: -18.1248, lon: 178.4501, baseAqi: 25, basePm25: 14, baseTemp: 25, baseHumidity: 75 },
];

function generateMonthlyData(baseAqi: number, basePm25: number, baseTemp: number, baseHumidity: number, isChina: boolean, seed: number): ClimateRecord[] {
  const monthlyData: ClimateRecord[] = [];
  const startYear = 2020;
  const endYear = 2025;

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const monthIndex = (year - startYear) * 12 + month;
      
      let aqiMultiplier = 1;
      let pm25Multiplier = 1;
      
      if (isChina) {
        if (year === 2020 && month >= 0 && month <= 3) {
          aqiMultiplier = 0.5 + (month / 3) * 0.3;
          pm25Multiplier = 0.45 + (month / 3) * 0.35;
        } else if (year === 2020 && month > 3) {
          aqiMultiplier = 0.8 + ((month - 4) / 8) * 0.15;
          pm25Multiplier = 0.8 + ((month - 4) / 8) * 0.15;
        } else if (year === 2021) {
          aqiMultiplier = 0.95 + Math.sin(month * 0.5) * 0.05;
          pm25Multiplier = 0.95 + Math.sin(month * 0.5) * 0.05;
        } else if (year >= 2022) {
          const recoveryFactor = Math.min(1, 0.95 + (year - 2022) * 0.02);
          aqiMultiplier = recoveryFactor + Math.sin(month * 0.4 + seed) * 0.08;
          pm25Multiplier = recoveryFactor + Math.sin(month * 0.4 + seed) * 0.08;
        }
      } else {
        const seasonalVariation = Math.sin((month + seed) * Math.PI / 6) * 0.15;
        aqiMultiplier = 1 + seasonalVariation;
        pm25Multiplier = 1 + seasonalVariation;
      }

      const seasonalTemp = Math.sin((month - 1 + seed * 2) * Math.PI / 6) * 10;
      const seasonalHumidity = Math.sin((month + seed) * Math.PI / 6) * 15;

      const randomFactor = 0.9 + (Math.sin(monthIndex * 1.5 + seed * 3) + 1) * 0.1;

      monthlyData.push({
        aqi: Math.max(10, Math.min(300, baseAqi * aqiMultiplier * randomFactor)),
        pm25: Math.max(5, Math.min(250, basePm25 * pm25Multiplier * randomFactor)),
        temperature: baseTemp + seasonalTemp + (Math.sin(monthIndex + seed) * 2),
        humidity: Math.max(30, Math.min(90, baseHumidity + seasonalHumidity))
      });
    }
  }

  return monthlyData;
}

function generateAdditionalCities(): typeof CITIES_TEMPLATE {
  const additional: typeof CITIES_TEMPLATE = [];
  const continents = ['asia', 'europe', 'northAmerica', 'southAmerica', 'africa', 'oceania'];
  const continentConfig: Record<string, { latRange: [number, number]; lonRange: [number, number]; baseAqiRange: [number, number] }> = {
    asia: { latRange: [10, 50], lonRange: [70, 140], baseAqiRange: [40, 120] },
    europe: { latRange: [35, 65], lonRange: [-10, 40], baseAqiRange: [20, 60] },
    northAmerica: { latRange: [25, 55], lonRange: [-125, -70], baseAqiRange: [30, 70] },
    southAmerica: { latRange: [-35, 10], lonRange: [-80, -35], baseAqiRange: [30, 70] },
    africa: { latRange: [-30, 35], lonRange: [-15, 50], baseAqiRange: [40, 100] },
    oceania: { latRange: [-45, -10], lonRange: [110, 180], baseAqiRange: [20, 50] }
  };

  let idCounter = CITIES_TEMPLATE.length;
  const citiesNeeded = 300 - CITIES_TEMPLATE.length;

  for (const continent of continents) {
    const config = continentConfig[continent];
    const count = Math.floor(citiesNeeded / 6) + (continent === 'asia' ? 30 : continent === 'europe' ? 15 : 0);
    
    for (let i = 0; i < count && idCounter < 300; i++) {
      const lat = config.latRange[0] + Math.random() * (config.latRange[1] - config.latRange[0]);
      const lon = config.lonRange[0] + Math.random() * (config.lonRange[1] - config.lonRange[0]);
      const baseAqi = config.baseAqiRange[0] + Math.random() * (config.baseAqiRange[1] - config.baseAqiRange[0]);
      
      additional.push({
        name: `City_${idCounter}`,
        country: 'Unknown',
        continent: continent,
        lat,
        lon,
        baseAqi,
        basePm25: baseAqi * 0.7,
        baseTemp: 15 + (lat < 0 ? -lat * 0.3 : lat * -0.25),
        baseHumidity: 55 + Math.random() * 20
      });
      idCounter++;
    }
  }

  return additional;
}

export class DataLoader {
  private cityData: CityData[] = [];
  private heatmapPoints: HeatmapPoint[] = [];

  constructor() {}

  loadData(): void {
    const allCitiesTemplate = [...CITIES_TEMPLATE, ...generateAdditionalCities()];
    
    this.cityData = allCitiesTemplate.slice(0, 300).map((city, index) => ({
      id: `city_${index}`,
      name: city.name,
      country: city.country,
      continent: city.continent,
      latitude: city.lat,
      longitude: city.lon,
      monthlyData: generateMonthlyData(
        city.baseAqi,
        city.basePm25,
        city.baseTemp,
        city.baseHumidity,
        city.country === '中国',
        index * 0.7
      )
    }));

    this.generateHeatmapPoints();
    eventBus.emit(EventType.DATA_UPDATED, this.cityData);
  }

  private generateHeatmapPoints(): void {
    const points: HeatmapPoint[] = [];
    const numPoints = 5000;

    for (let i = 0; i < numPoints; i++) {
      const lat = (Math.random() - 0.5) * 180;
      const lon = (Math.random() - 0.5) * 360;
      
      let intensity = Math.random() * 0.3;
      
      for (const city of this.cityData) {
        const latDiff = Math.abs(lat - city.latitude);
        const lonDiff = Math.abs(lon - city.longitude);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        if (distance < 10) {
          const cityIntensity = (city.monthlyData[0].aqi / 150) * (1 - distance / 10);
          intensity = Math.min(1, intensity + cityIntensity * 0.5);
        }
      }
      
      points.push({
        latitude: lat,
        longitude: lon,
        intensity: Math.min(1, intensity)
      });
    }

    this.heatmapPoints = points;
  }

  getYearMonthData(year: number, month: number): CityData[] {
    const monthIndex = (year - 2020) * 12 + month;
    return this.cityData.map(city => ({
      ...city,
      monthlyData: [city.monthlyData[monthIndex]]
    }));
  }

  getCityById(id: string): CityData | undefined {
    return this.cityData.find(city => city.id === id);
  }

  getCitiesByContinent(continent: Continent): CityData[] {
    if (continent === 'all') return this.cityData;
    return this.cityData.filter(city => city.continent === continent);
  }

  getHeatmapPoints(): HeatmapPoint[] {
    return this.heatmapPoints;
  }

  getAllCities(): CityData[] {
    return this.cityData;
  }
}

export const dataLoader = new DataLoader();
export default dataLoader;
