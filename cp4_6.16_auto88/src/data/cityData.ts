import { City } from '@/types';

export const cities: City[] = [
  { id: 'bj', name: '北京', lat: 39.9042, lng: 116.4074, province: '北京市' },
  { id: 'sh', name: '上海', lat: 31.2304, lng: 121.4737, province: '上海市' },
  { id: 'gz', name: '广州', lat: 23.1291, lng: 113.2644, province: '广东省' },
  { id: 'sz', name: '深圳', lat: 22.5431, lng: 114.0579, province: '广东省' },
  { id: 'cd', name: '成都', lat: 30.5728, lng: 104.0668, province: '四川省' },
  { id: 'cq', name: '重庆', lat: 29.4316, lng: 106.9123, province: '重庆市' },
  { id: 'hz', name: '杭州', lat: 30.2741, lng: 120.1551, province: '浙江省' },
  { id: 'nj', name: '南京', lat: 32.0603, lng: 118.7969, province: '江苏省' },
  { id: 'wh', name: '武汉', lat: 30.5928, lng: 114.3055, province: '湖北省' },
  { id: 'xa', name: '西安', lat: 34.3416, lng: 108.9398, province: '陕西省' },
  { id: 'tj', name: '天津', lat: 39.0842, lng: 117.2009, province: '天津市' },
  { id: 'suz', name: '苏州', lat: 31.2989, lng: 120.5853, province: '江苏省' },
  { id: 'cs', name: '长沙', lat: 28.2282, lng: 112.9388, province: '湖南省' },
  { id: 'zz', name: '郑州', lat: 34.7466, lng: 113.6253, province: '河南省' },
  { id: 'qd', name: '青岛', lat: 36.0671, lng: 120.3826, province: '山东省' },
  { id: 'jn', name: '济南', lat: 36.6512, lng: 117.1201, province: '山东省' },
  { id: 'sy', name: '沈阳', lat: 41.8057, lng: 123.4315, province: '辽宁省' },
  { id: 'hrb', name: '哈尔滨', lat: 45.8038, lng: 126.5349, province: '黑龙江省' },
  { id: 'km', name: '昆明', lat: 24.8801, lng: 102.8329, province: '云南省' },
  { id: 'gy', name: '贵阳', lat: 26.6470, lng: 106.6302, province: '贵州省' },
  { id: 'nn', name: '南宁', lat: 22.8170, lng: 108.3665, province: '广西壮族自治区' },
  { id: 'fz', name: '福州', lat: 26.0745, lng: 119.2965, province: '福建省' },
  { id: 'xm', name: '厦门', lat: 24.4798, lng: 118.0894, province: '福建省' },
  { id: 'hef', name: '合肥', lat: 31.8206, lng: 117.2272, province: '安徽省' },
  { id: 'nc', name: '南昌', lat: 28.6820, lng: 115.8579, province: '江西省' },
];

export const searchCities = (query: string): City[] => {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return cities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) ||
    city.province.toLowerCase().includes(lowerQuery)
  );
};
