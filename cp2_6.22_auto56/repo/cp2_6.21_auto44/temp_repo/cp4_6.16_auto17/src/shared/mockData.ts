import { saveTrail, saveTrackPoint, savePOI, getAllTrails, getAllPOIs } from './db';
import { v4 as uuidv4 } from 'uuid';
import { calculateTotalDistance, calculateAvgElevation } from './utils';

interface TrailConfig {
  id: string;
  name: string;
  startLat: number;
  startLng: number;
  numPoints: number;
  distancePerPoint: number;
  baseElevation: number;
  elevationGains: number[];
  createdAt: Date;
  likes: number;
  isPublic: boolean;
  pois: POIConfig[];
}

interface POIConfig {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

const XIANGSHAN_POIS: POIConfig[] = [
  { name: '香炉峰', description: '香山最高峰，海拔575米，可俯瞰北京城', lat: 39.9965, lng: 116.1879 },
  { name: '双清别墅', description: '毛泽东曾居住办公之地，革命圣地', lat: 39.9912, lng: 116.1895 },
  { name: '碧云寺', description: '始建于元代的千年古刹，五百罗汉堂闻名', lat: 39.9988, lng: 116.1932 },
  { name: '眼镜湖', description: '形似眼镜的人工湖，夏秋赏荷胜地', lat: 39.9895, lng: 116.1912 },
  { name: '玉华岫', description: '乾隆时期建筑，观赏红叶绝佳处', lat: 39.9938, lng: 116.1867 },
  { name: '森玉笏', description: '巨石如朝臣手持玉笏，香山二十八景之一', lat: 39.9952, lng: 116.1856 },
  { name: '阆风亭', description: '半山腰观景亭，远眺昆明湖', lat: 39.9925, lng: 116.1883 },
];

const BADALING_POIS: POIConfig[] = [
  { name: '北八楼', description: '八达岭长城最高点，海拔888米，好汉坡终点', lat: 40.3586, lng: 116.0198 },
  { name: '关城', description: '八达岭长城门户，明代防御工事', lat: 40.3539, lng: 116.0203 },
  { name: '南四楼', description: '南段长城制高点，视野开阔', lat: 40.3521, lng: 116.0235 },
  { name: '敌楼', description: '明代戍边将士驻守瞭望之所', lat: 40.3567, lng: 116.0215 },
  { name: '缆车下站', description: '北线索道起点，直达北七楼', lat: 40.3518, lng: 116.0196 },
  { name: '好汉碑', description: '"不到长城非好汉"题词碑刻', lat: 40.3572, lng: 116.0207 },
  { name: '八达岭熊乐园', description: '长城脚下黑熊养殖观赏园', lat: 40.3495, lng: 116.0221 },
  { name: '古炮', description: '明代古炮台，城防历史见证', lat: 40.3532, lng: 116.0211 },
];

const MUTIANYU_POIS: POIConfig[] = [
  { name: '正关台', description: '慕田峪关隘，三座敌楼并矗罕见形制', lat: 40.4312, lng: 116.5623 },
  { name: '大角楼', description: '慕田峪东段制高点，视野极佳', lat: 40.4356, lng: 116.5687 },
  { name: '鹰飞倒仰', description: '长城最险段之一，近乎垂直', lat: 40.4289, lng: 116.5567 },
  { name: '箭扣长城', description: '未修复的野长城，摄影爱好者圣地', lat: 40.4265, lng: 116.5512 },
  { name: '鸳鸯松', description: '两棵古松缠绕共生，树龄千年', lat: 40.4321, lng: 116.5645 },
  { name: '缆车山顶站', description: '索道终点，登长城捷径', lat: 40.4334, lng: 116.5656 },
  { name: '滑道下站', description: '旱地雪橇起点，趣味下山方式', lat: 40.4302, lng: 116.5634 },
  { name: '中华梦石城', description: '奇石主题园区，怪石林立', lat: 40.4278, lng: 116.5612 },
  { name: '亓连关', description: '慕田峪关隘，连接莲花池长城', lat: 40.4245, lng: 116.5478 },
];

function generateMockTrailPoints(config: TrailConfig) {
  const points = [];
  let currentLat = config.startLat;
  let currentLng = config.startLng;
  const startTime = new Date(config.createdAt).getTime();

  for (let i = 0; i < config.numPoints; i++) {
    const progress = i / (config.numPoints - 1);
    const angle = progress * Math.PI * 0.7 + Math.sin(i * 0.5) * 0.15;
    const latDelta = (Math.sin(angle) * config.distancePerPoint) / 111000;
    const lngDelta = (Math.cos(angle) * config.distancePerPoint) / (111000 * Math.cos(currentLat * Math.PI / 180));

    currentLat += latDelta;
    currentLng += lngDelta;

    const elevationGain = config.elevationGains[Math.min(Math.floor(progress * config.elevationGains.length), config.elevationGains.length - 1)] || 0;
    const elevation = config.baseElevation + elevationGain * progress + Math.sin(i * 0.4) * 15 + Math.random() * 8;

    points.push({
      id: uuidv4(),
      trailId: config.id,
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      elevation: Number(elevation.toFixed(1)),
      timestamp: new Date(startTime + i * 60000),
    });
  }

  return points;
}

function generateGlobalPOIs(count: number) {
  const pois = [];
  const centerLat = 39.9042;
  const centerLng = 116.4074;
  const poiNames = [
    '公园', '餐馆', '咖啡馆', '便利店', '药店', '银行', '加油站', '停车场',
    '地铁站', '公交站', '医院', '学校', '超市', '商场', '电影院', '健身房',
    '图书馆', '博物馆', '景点', '寺庙', '教堂', '广场', '公园', '景区',
    '酒店', '民宿', '书店', '花店', '宠物店', '快递站', '邮局', 'ATM',
  ];
  const poiDescs = [
    '环境优美，适合休闲放松',
    '地理位置优越，交通便利',
    '老字号店铺，品质保证',
    '24小时营业，服务周到',
    '设施齐全，体验极佳',
    '价格实惠，性价比高',
    '人气旺盛，值得一去',
    '新开店铺，欢迎光临',
  ];

  for (let i = 0; i < count; i++) {
    const radius = 0.02 + Math.random() * 0.15;
    const angle = Math.random() * Math.PI * 2;
    const lat = centerLat + Math.sin(angle) * radius;
    const lng = centerLng + Math.cos(angle) * radius;

    pois.push({
      id: uuidv4(),
      trailId: null,
      name: poiNames[i % poiNames.length] + ` #${i + 1}`,
      description: poiDescs[i % poiDescs.length],
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  return pois;
}

const TRAIL_CONFIGS: TrailConfig[] = [
  {
    id: uuidv4(),
    name: '香山公园徒步穿越',
    startLat: 39.9876,
    startLng: 116.1923,
    numPoints: 45,
    distancePerPoint: 65,
    baseElevation: 120,
    elevationGains: [50, 150, 280, 380, 450],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 42,
    isPublic: true,
    pois: XIANGSHAN_POIS,
  },
  {
    id: uuidv4(),
    name: '八达岭长城全程徒步',
    startLat: 40.3502,
    startLng: 116.0218,
    numPoints: 58,
    distancePerPoint: 45,
    baseElevation: 550,
    elevationGains: [80, 180, 250, 320, 330, 280, 200],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    likes: 128,
    isPublic: true,
    pois: BADALING_POIS,
  },
  {
    id: uuidv4(),
    name: '慕田峪长城精华段',
    startLat: 40.4268,
    startLng: 116.5589,
    numPoints: 38,
    distancePerPoint: 55,
    baseElevation: 480,
    elevationGains: [100, 220, 350, 400, 360, 300],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    likes: 87,
    isPublic: true,
    pois: MUTIANYU_POIS,
  },
];

export async function initMockData() {
  try {
    const existingTrails = await getAllTrails();
    const existingPOIs = await getAllPOIs();

    if (existingTrails.length > 0 && existingPOIs.length >= 200) {
      return false;
    }

    for (const config of TRAIL_CONFIGS) {
      const points = generateMockTrailPoints(config);
      const distance = calculateTotalDistance(points);
      const avgElevation = calculateAvgElevation(points);

      await saveTrail({
        id: config.id,
        name: config.name,
        createdAt: config.createdAt,
        distance,
        avgElevation,
        isPublic: config.isPublic,
        likes: config.likes,
      });

      for (const point of points) {
        await saveTrackPoint(point);
      }

      for (const poiConfig of config.pois) {
        await savePOI({
          id: uuidv4(),
          trailId: config.id,
          name: poiConfig.name,
          description: poiConfig.description,
          lat: poiConfig.lat,
          lng: poiConfig.lng,
          createdAt: new Date(config.createdAt.getTime() + 60000),
        });
      }
    }

    const globalPOIs = generateGlobalPOIs(250);
    for (const poi of globalPOIs) {
      await savePOI(poi);
    }

    return true;
  } catch (error) {
    console.error('初始化mock数据失败:', error);
    return false;
  }
}
