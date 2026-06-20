export const LOCATION_SUGGESTIONS = [
  { name: '故宫博物院', city: '北京' },
  { name: '长城', city: '北京' },
  { name: '天安门广场', city: '北京' },
  { name: '颐和园', city: '北京' },
  { name: '外滩', city: '上海' },
  { name: '东方明珠', city: '上海' },
  { name: '迪士尼乐园', city: '上海' },
  { name: '西湖', city: '杭州' },
  { name: '灵隐寺', city: '杭州' },
  { name: '千岛湖', city: '杭州' },
  { name: '夫子庙', city: '南京' },
  { name: '中山陵', city: '南京' },
  { name: '大熊猫繁育研究基地', city: '成都' },
  { name: '宽窄巷子', city: '成都' },
  { name: '锦里古街', city: '成都' },
  { name: '大雁塔', city: '西安' },
  { name: '兵马俑', city: '西安' },
  { name: '回民街', city: '西安' },
  { name: '鼓浪屿', city: '厦门' },
  { name: '厦门大学', city: '厦门' },
  { name: '洪崖洞', city: '重庆' },
  { name: '解放碑', city: '重庆' },
  { name: '星巴克', city: '' },
  { name: '海底捞火锅', city: '' },
  { name: '火车站', city: '' },
  { name: '机场', city: '' },
];

export function searchLocations(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return LOCATION_SUGGESTIONS.filter(
    (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
  ).slice(0, 8);
}
