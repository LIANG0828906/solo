import { v4 as uuidv4 } from 'uuid';
import type { Diary, Location } from '@/types';

const PLACES = [
  { name: '巴黎', lat: 48.8566, lng: 2.3522, country: '法国' },
  { name: '东京', lat: 35.6762, lng: 139.6503, country: '日本' },
  { name: '纽约', lat: 40.7128, lng: -74.0060, country: '美国' },
  { name: '伦敦', lat: 51.5074, lng: -0.1278, country: '英国' },
  { name: '罗马', lat: 41.9028, lng: 12.4964, country: '意大利' },
  { name: '北京', lat: 39.9042, lng: 116.4074, country: '中国' },
  { name: '上海', lat: 31.2304, lng: 121.4737, country: '中国' },
  { name: '悉尼', lat: -33.8688, lng: 151.2093, country: '澳大利亚' },
  { name: '开罗', lat: 30.0444, lng: 31.2357, country: '埃及' },
  { name: '里约热内卢', lat: -22.9068, lng: -43.1729, country: '巴西' },
  { name: '迪拜', lat: 25.2048, lng: 55.2708, country: '阿联酋' },
  { name: '首尔', lat: 37.5665, lng: 126.9780, country: '韩国' },
  { name: '曼谷', lat: 13.7563, lng: 100.5018, country: '泰国' },
  { name: '新加坡', lat: 1.3521, lng: 103.8198, country: '新加坡' },
  { name: '莫斯科', lat: 55.7558, lng: 37.6173, country: '俄罗斯' },
  { name: '伊斯坦布尔', lat: 41.0082, lng: 28.9784, country: '土耳其' },
  { name: '巴塞罗那', lat: 41.3851, lng: 2.1734, country: '西班牙' },
  { name: '阿姆斯特丹', lat: 52.3676, lng: 4.9041, country: '荷兰' },
  { name: '威尼斯', lat: 45.4408, lng: 12.3155, country: '意大利' },
  { name: '圣托里尼', lat: 36.3932, lng: 25.4615, country: '希腊' },
  { name: '丽江', lat: 26.8721, lng: 100.2299, country: '中国' },
  { name: '拉萨', lat: 29.6548, lng: 91.1392, country: '中国' },
];

const MOODS = ['😊', '😄', '🥰', '😌', '🤩', '😎', '🥲', '😴', '🤔', '🌟'];

const DIARY_TITLES = [
  '漫步在塞纳河畔的浪漫午后',
  '东京塔下的第一次相遇',
  '时代广场的跨年之夜',
  '大英博物馆的奇妙之旅',
  '古罗马斗兽场的历史回响',
  '故宫紫禁城的金色黄昏',
  '外滩夜景与东方明珠',
  '悉尼歌剧院的完美日落',
  '金字塔下的千年谜题',
  '科帕卡巴纳海滩的狂欢',
  '哈利法塔上的云端漫步',
  '首尔塔下的初雪',
  '大皇宫的金色辉煌',
  '滨海湾花园的超级树',
  '红场的克里姆林宫',
  '蓝色清真寺的神秘光影',
  '圣家堂的高迪幻想',
  '运河上的风车之国',
  '威尼斯小艇的浪漫之旅',
  '蓝白小镇的爱琴海',
  '古城丽江的柔软时光',
  '布达拉宫的心灵净化',
];

const DIARY_SUMMARIES = [
  '今天的阳光刚刚好，微风轻拂，仿佛整个城市都在为我微笑...',
  '没想到会在这里遇见如此美丽的风景，心灵被深深震撼了...',
  '旅行的意义不在于目的地，而在于沿途的风景和看风景的心情...',
  '每一次出发都是一次新的冒险，这次也不例外，充满了惊喜...',
  '站在这里，感受到了历史的厚重与时间的流逝，心生敬畏...',
  '当地的美食令人难忘，每一口都是对味蕾的极致享受...',
  '认识了很多有趣的朋友，听他们的故事，分享我的经历...',
  '大自然的鬼斧神工令人叹为观止，人类在它面前是如此渺小...',
  '城市的霓虹闪烁，与星空交相辉映，构成了最美的夜晚...',
  '这一刻，时间仿佛静止了，只想永远留住这份美好...',
];

const IMAGE_PROMPTS = [
  'beautiful sunset over historic european city architecture warm golden hour',
  'tokyo street scene with cherry blossoms spring aesthetic',
  'new york manhattan skyline from hudson river dusk',
  'ancient roman ruins colosseum dramatic lighting',
  'paris eiffel tower romantic evening lights',
  'beijing forbidden city traditional chinese architecture',
  'shanghai bund neon lights night view',
  'sydney opera house harbor bridge sunset',
  'great pyramid of giza desert landscape',
  'rio de janeiro copacabana beach carnival',
  'dubai burj khalifa futuristic cityscape',
  'seoul gyeongbokgung palace traditional korean',
  'bangkok grand palace golden temples',
  'singapore gardens by the bay supertrees',
  'moscow red square kremlin winter snow',
  'istanbul blue mosque interior architecture',
  'barcelona sagrada familia gaudi architecture',
  'amsterdam canals windmills netherlands',
  'venice gondola canal grand italy',
  'santorini greece white buildings blue domes',
  'lijiang ancient town china water town',
  'tibet potala palace himalayas mountains',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(): string {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

function getImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_16_9`;
}

export function generateMockData(): { diaries: Diary[]; locations: Location[] } {
  const locations: Location[] = PLACES.map((place) => ({
    id: uuidv4(),
    name: `${place.name}，${place.country}`,
    lat: place.lat,
    lng: place.lng,
    diaryCount: 0,
  }));

  const diaries: Diary[] = [];
  const diaryCountMap = new Map<string, number>();

  for (let i = 0; i < 55; i++) {
    const location = getRandomItem(locations);
    const imagePrompt = getRandomItem(IMAGE_PROMPTS);
    const date = getRandomDate();
    
    const diary: Diary = {
      id: uuidv4(),
      title: getRandomItem(DIARY_TITLES),
      content: `# ${getRandomItem(DIARY_TITLES)}\n\n${getRandomItem(DIARY_SUMMARIES)}\n\n这是一段美好的旅行回忆。\n\n---\n\n今天发生了很多有趣的事情。\n\n早晨，我早早地起床，推开窗户，清新的空气扑面而来。\n\n午后，在当地的小咖啡馆里，品尝了正宗的咖啡和甜点。\n\n傍晚，看着太阳慢慢落下，天边被染成了金黄色，那一刻真的太美了。`,
      images: [
        getImageUrl(imagePrompt),
        getImageUrl(getRandomItem(IMAGE_PROMPTS)),
        getImageUrl(getRandomItem(IMAGE_PROMPTS)),
      ],
      mood: getRandomItem(MOODS),
      locationId: location.id,
      locationName: location.name,
      lat: location.lat + (Math.random() - 0.5) * 0.05,
      lng: location.lng + (Math.random() - 0.5) * 0.05,
      createdAt: date,
      updatedAt: date,
    };

    diaries.push(diary);
    diaryCountMap.set(location.id, (diaryCountMap.get(location.id) || 0) + 1);
  }

  locations.forEach((loc) => {
    loc.diaryCount = diaryCountMap.get(loc.id) || 0;
  });

  return { diaries, locations: locations.filter((l) => l.diaryCount > 0) };
}
