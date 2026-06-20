import type { Star, Constellation } from '@/types';

const fenyeMap: Record<string, string> = {
  '角宿': '兖州', '亢宿': '兖州', '氐宿': '豫州', '房宿': '豫州',
  '心宿': '豫州', '尾宿': '荆州', '箕宿': '荆州', '斗宿': '扬州',
  '牛宿': '扬州', '女宿': '幽州', '虚宿': '幽州', '危宿': '并州',
  '室宿': '并州', '壁宿': '卫国', '奎宿': '鲁国', '娄宿': '鲁国',
  '胃宿': '赵国', '昴宿': '赵国', '毕宿': '魏国', '觜宿': '魏国',
  '参宿': '益州', '井宿': '雍州', '鬼宿': '雍州', '柳宿': '三河',
  '星宿': '三河', '张宿': '楚国', '翼宿': '楚国', '轸宿': '荆州',
};

const westernConstellationMap: Record<string, string> = {
  '角宿': '室女座', '亢宿': '室女座', '氐宿': '天秤座', '房宿': '天蝎座',
  '心宿': '天蝎座', '尾宿': '天蝎座', '箕宿': '人马座', '斗宿': '人马座',
  '牛宿': '摩羯座', '女宿': '宝瓶座', '虚宿': '宝瓶座', '危宿': '飞马座',
  '室宿': '飞马座', '壁宿': '飞马座', '奎宿': '仙女座', '娄宿': '白羊座',
  '胃宿': '白羊座', '昴宿': '金牛座', '毕宿': '金牛座', '觜宿': '猎户座',
  '参宿': '猎户座', '井宿': '双子座', '鬼宿': '巨蟹座', '柳宿': '长蛇座',
  '星宿': '长蛇座', '张宿': '长蛇座', '翼宿': '巨爵座', '轸宿': '乌鸦座',
};

const constellationConfigs = [
  { name: '角宿', raStart: 170, decStart: -10, mainStars: 2, auxStars: 8, western: '室女座', fenye: '兖州' },
  { name: '亢宿', raStart: 185, decStart: -5, mainStars: 4, auxStars: 7, western: '室女座', fenye: '兖州' },
  { name: '氐宿', raStart: 195, decStart: -15, mainStars: 4, auxStars: 11, western: '天秤座', fenye: '豫州' },
  { name: '房宿', raStart: 210, decStart: -20, mainStars: 4, auxStars: 6, western: '天蝎座', fenye: '豫州' },
  { name: '心宿', raStart: 225, decStart: -26, mainStars: 3, auxStars: 8, western: '天蝎座', fenye: '豫州' },
  { name: '尾宿', raStart: 240, decStart: -35, mainStars: 9, auxStars: 6, western: '天蝎座', fenye: '荆州' },
  { name: '箕宿', raStart: 255, decStart: -28, mainStars: 4, auxStars: 6, western: '人马座', fenye: '荆州' },
  { name: '斗宿', raStart: 265, decStart: -30, mainStars: 6, auxStars: 10, western: '人马座', fenye: '扬州' },
  { name: '牛宿', raStart: 280, decStart: -20, mainStars: 6, auxStars: 9, western: '摩羯座', fenye: '扬州' },
  { name: '女宿', raStart: 295, decStart: -10, mainStars: 4, auxStars: 8, western: '宝瓶座', fenye: '幽州' },
  { name: '虚宿', raStart: 305, decStart: 0, mainStars: 2, auxStars: 10, western: '宝瓶座', fenye: '幽州' },
  { name: '危宿', raStart: 315, decStart: 5, mainStars: 3, auxStars: 10, western: '飞马座', fenye: '并州' },
  { name: '室宿', raStart: 330, decStart: 10, mainStars: 2, auxStars: 14, western: '飞马座', fenye: '并州' },
  { name: '壁宿', raStart: 350, decStart: 15, mainStars: 2, auxStars: 8, western: '飞马座', fenye: '卫国' },
  { name: '奎宿', raStart: 10, decStart: 25, mainStars: 16, auxStars: 5, western: '仙女座', fenye: '鲁国' },
  { name: '娄宿', raStart: 25, decStart: 20, mainStars: 3, auxStars: 8, western: '白羊座', fenye: '鲁国' },
  { name: '胃宿', raStart: 35, decStart: 15, mainStars: 3, auxStars: 7, western: '白羊座', fenye: '赵国' },
  { name: '昴宿', raStart: 45, decStart: 20, mainStars: 7, auxStars: 8, western: '金牛座', fenye: '赵国' },
  { name: '毕宿', raStart: 60, decStart: 15, mainStars: 8, auxStars: 10, western: '金牛座', fenye: '魏国' },
  { name: '觜宿', raStart: 75, decStart: 10, mainStars: 3, auxStars: 5, western: '猎户座', fenye: '魏国' },
  { name: '参宿', raStart: 85, decStart: 0, mainStars: 7, auxStars: 10, western: '猎户座', fenye: '益州' },
  { name: '井宿', raStart: 95, decStart: 10, mainStars: 8, auxStars: 15, western: '双子座', fenye: '雍州' },
  { name: '鬼宿', raStart: 110, decStart: 18, mainStars: 4, auxStars: 7, western: '巨蟹座', fenye: '雍州' },
  { name: '柳宿', raStart: 120, decStart: 10, mainStars: 8, auxStars: 5, western: '长蛇座', fenye: '三河' },
  { name: '星宿', raStart: 130, decStart: -5, mainStars: 7, auxStars: 6, western: '长蛇座', fenye: '三河' },
  { name: '张宿', raStart: 140, decStart: -10, mainStars: 6, auxStars: 5, western: '长蛇座', fenye: '楚国' },
  { name: '翼宿', raStart: 150, decStart: -15, mainStars: 22, auxStars: 5, western: '巨爵座', fenye: '楚国' },
  { name: '轸宿', raStart: 165, decStart: -20, mainStars: 4, auxStars: 7, western: '乌鸦座', fenye: '荆州' },
];

function generateStars(): Star[] {
  const stars: Star[] = [];
  let idCounter = 0;

  constellationConfigs.forEach((config) => {
    for (let i = 0; i < config.mainStars; i++) {
      const ra = config.raStart + (i * 3) + (Math.random() - 0.5) * 4;
      const dec = config.decStart + (i * 2) + (Math.random() - 0.5) * 6;
      const magnitude = 0.5 + Math.random() * 2.5;
      
      stars.push({
        id: `star-${idCounter++}`,
        name: `${config.name}${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二'][i]}`,
        constellation: config.name,
        westernConstellation: config.western,
        magnitude: Math.round(magnitude * 10) / 10,
        ra: ((ra % 360) + 360) % 360,
        dec: Math.max(-89, Math.min(89, dec)),
        fenye: config.fenye,
        isMain: true,
      });
    }

    for (let i = 0; i < config.auxStars; i++) {
      const ra = config.raStart + (Math.random() - 0.5) * 20;
      const dec = config.decStart + (Math.random() - 0.5) * 20;
      const magnitude = 3 + Math.random() * 3;
      
      stars.push({
        id: `star-${idCounter++}`,
        name: `${config.name}辅${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'][i]}`,
        constellation: config.name,
        westernConstellation: config.western,
        magnitude: Math.round(magnitude * 10) / 10,
        ra: ((ra % 360) + 360) % 360,
        dec: Math.max(-89, Math.min(89, dec)),
        fenye: config.fenye,
        isMain: false,
      });
    }
  });

  return stars;
}

function generateConstellations(stars: Star[]): Constellation[] {
  return constellationConfigs.map((config) => {
    const constellationStars = stars
      .filter((s) => s.constellation === config.name && s.isMain)
      .map((s) => s.id);

    const lines: [number, number][] = [];
    for (let i = 0; i < constellationStars.length - 1; i++) {
      lines.push([i, i + 1]);
    }
    if (constellationStars.length > 2) {
      lines.push([0, constellationStars.length - 1]);
    }
    if (constellationStars.length > 4) {
      lines.push([0, Math.floor(constellationStars.length / 2)]);
    }

    return {
      name: config.name,
      stars: constellationStars,
      lines,
    };
  });
}

export const stars = generateStars();
export const constellations = generateConstellations(stars);

export { fenyeMap, westernConstellationMap };

export function raDecToVector3(ra: number, dec: number, radius: number = 100): [number, number, number] {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);
  
  return [x, y, z];
}

export function getStarById(id: string): Star | undefined {
  return stars.find((s) => s.id === id);
}

export function searchStars(query: string): Star[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return stars.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.constellation.toLowerCase().includes(lowerQuery) ||
      s.fenye.toLowerCase().includes(lowerQuery) ||
      s.westernConstellation.toLowerCase().includes(lowerQuery)
  );
}
