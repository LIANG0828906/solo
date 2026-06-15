import type { SearchLocationResult } from '@/shared/types';

const MOCK_LOCATIONS: SearchLocationResult[] = [
  { id: '1', name: '故宫博物院', displayName: '北京市东城区景山前街4号', lat: 39.9163, lng: 116.3972 },
  { id: '2', name: '天安门广场', displayName: '北京市东城区长安街', lat: 39.9031, lng: 116.3976 },
  { id: '3', name: '颐和园', displayName: '北京市海淀区新建宫门路19号', lat: 39.9999, lng: 116.2755 },
  { id: '4', name: '西湖', displayName: '浙江省杭州市西湖区', lat: 30.2430, lng: 120.1446 },
  { id: '5', name: '东方明珠', displayName: '上海市浦东新区世纪大道1号', lat: 31.2397, lng: 121.4998 },
  { id: '6', name: '外滩', displayName: '上海市黄浦区中山东一路', lat: 31.2304, lng: 121.4737 },
  { id: '7', name: '长城', displayName: '北京市延庆区G6京藏高速58号出口', lat: 40.4319, lng: 116.5704 },
  { id: '8', name: '兵马俑', displayName: '陕西省西安市临潼区秦陵北路', lat: 34.3842, lng: 109.2738 },
  { id: '9', name: '黄山', displayName: '安徽省黄山市黄山区', lat: 30.1298, lng: 118.1698 },
  { id: '10', name: '九寨沟', displayName: '四川省阿坝藏族羌族自治州九寨沟县', lat: 33.1638, lng: 103.9181 },
];

export async function searchLocation(query: string): Promise<SearchLocationResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return MOCK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.displayName.toLowerCase().includes(lowerQuery)
  );
}
