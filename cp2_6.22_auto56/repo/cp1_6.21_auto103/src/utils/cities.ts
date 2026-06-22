export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '重庆': { lat: 29.4316, lng: 106.9123 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '苏州': { lat: 31.2990, lng: 120.5853 },
  '天津': { lat: 39.0842, lng: 117.2009 },
  '长沙': { lat: 28.2282, lng: 112.9388 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '厦门': { lat: 24.4798, lng: 118.0894 },
  '昆明': { lat: 25.0389, lng: 102.7183 },
  '大连': { lat: 38.9140, lng: 121.6147 },
  '哈尔滨': { lat: 45.8038, lng: 126.5350 },
  '三亚': { lat: 18.2528, lng: 109.5119 },
  '拉萨': { lat: 29.6520, lng: 91.1721 },
  '桂林': { lat: 25.2736, lng: 110.2907 },
  '丽江': { lat: 26.8721, lng: 100.2299 },
  '大理': { lat: 25.6066, lng: 100.2679 },
  '凤凰': { lat: 27.9480, lng: 109.6012 },
  '阳朔': { lat: 24.7807, lng: 110.4892 },
  '敦煌': { lat: 40.1421, lng: 94.6620 },
  '乌鲁木齐': { lat: 43.8256, lng: 87.6168 },
  '呼和浩特': { lat: 40.8426, lng: 111.7511 },
  '沈阳': { lat: 41.8057, lng: 123.4315 },
  '郑州': { lat: 34.7466, lng: 113.6254 },
};

export const pinColors = [
  '#FF7043',
  '#42A5F5',
  '#66BB6A',
  '#FFA726',
  '#AB47BC',
];

export function getPinColor(index: number): string {
  return pinColors[index % pinColors.length];
}

export function getCityColor(city: string, activities: { city: string }[]): string {
  const uniqueCities = Array.from(new Set(activities.map(a => a.city)));
  const idx = uniqueCities.indexOf(city);
  return pinColors[Math.max(0, idx) % pinColors.length];
}
