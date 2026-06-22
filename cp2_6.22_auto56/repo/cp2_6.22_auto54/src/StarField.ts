import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface StarOfficialData {
  id: string;
  name: string;
  pinyin: string;
  constellation: string;
  description: string;
  stars: { ra: number; dec: number; brightness: number }[];
  connections: [number, number][];
  color: number;
}

export interface StarOfficial {
  data: StarOfficialData;
  positions: THREE.Vector3[];
  group: THREE.Group;
  points: THREE.Points;
  lines: THREE.Line[];
  label: CSS2DObject;
  originalColors: Float32Array;
}

const SPHERE_RADIUS = 100;

export const STAR_OFFICIALS_DATA: StarOfficialData[] = [
  {
    id: 'jiao', name: '角宿', pinyin: 'jiaosu', constellation: '东方苍龙七宿',
    description: '角宿二星，为苍龙之角，主造化万物，传布阳气，主春耕、农桑、造化。角宿一为室女座α，是全天第十七亮星。',
    stars: [
      { ra: 201.3, dec: -11.2, brightness: 1.0 },
      { ra: 202.0, dec: -13.4, brightness: 0.85 },
      { ra: 200.5, dec: -9.8, brightness: 0.5 },
      { ra: 203.2, dec: -12.0, brightness: 0.4 }
    ],
    connections: [[0, 1], [0, 2], [1, 3]],
    color: 0x4fc3f7
  },
  {
    id: 'kang', name: '亢宿', pinyin: 'kangsù', constellation: '东方苍龙七宿',
    description: '亢宿四星，为苍龙之前颈，主朝廷、庙殿、君臣、礼法。亢宿象征天子之内朝，总摄天下奏事。',
    stars: [
      { ra: 210.8, dec: 10.7, brightness: 0.9 },
      { ra: 211.5, dec: 8.8, brightness: 0.7 },
      { ra: 212.3, dec: 11.5, brightness: 0.55 },
      { ra: 213.0, dec: 9.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 3], [3, 2], [2, 0]],
    color: 0x81c784
  },
  {
    id: 'di', name: '氐宿', pinyin: 'disu', constellation: '东方苍龙七宿',
    description: '氐宿四星，为苍龙之前胸，主后妃之府、妾媵之室。氐宿为天子之路寝，又主疫疾、灾病。',
    stars: [
      { ra: 220.5, dec: 14.4, brightness: 0.85 },
      { ra: 219.8, dec: 16.2, brightness: 0.75 },
      { ra: 221.2, dec: 13.0, brightness: 0.5 },
      { ra: 222.0, dec: 15.5, brightness: 0.45 },
      { ra: 218.5, dec: 14.8, brightness: 0.4 }
    ],
    connections: [[0, 1], [0, 2], [0, 3], [1, 4]],
    color: 0xaed581
  },
  {
    id: 'fang', name: '房宿', pinyin: 'fangsu', constellation: '东方苍龙七宿',
    description: '房宿四星，为苍龙之腹，为明堂，天子布政之宫。房宿主车马、驿传、仓储、府藏，又为四辅之官。',
    stars: [
      { ra: 242.6, dec: -26.4, brightness: 1.0 },
      { ra: 243.8, dec: -25.8, brightness: 0.9 },
      { ra: 241.5, dec: -24.9, brightness: 0.6 },
      { ra: 244.2, dec: -23.5, brightness: 0.55 }
    ],
    connections: [[0, 1], [1, 3], [0, 2]],
    color: 0xffb74d
  },
  {
    id: 'xin', name: '心宿', pinyin: 'xinsu', constellation: '东方苍龙七宿',
    description: '心宿三星，为苍龙之心，中央大星为天王，前后二星为庶子。心宿主火星、明堂、祭祀，大火星为古代授时标准星。',
    stars: [
      { ra: 247.2, dec: -22.6, brightness: 0.9 },
      { ra: 248.1, dec: -26.4, brightness: 1.0 },
      { ra: 249.5, dec: -26.0, brightness: 0.8 }
    ],
    connections: [[0, 1], [1, 2]],
    color: 0xff8a65
  },
  {
    id: 'wei', name: '尾宿', pinyin: 'weisù', constellation: '东方苍龙七宿',
    description: '尾宿九星，为苍龙之尾，主后宫、九子、君臣、后妃。尾宿为九江口，主水事，又主盗贼、奸佞。',
    stars: [
      { ra: 254.5, dec: -43.0, brightness: 0.85 },
      { ra: 255.8, dec: -40.5, brightness: 0.8 },
      { ra: 256.9, dec: -38.2, brightness: 0.75 },
      { ra: 258.0, dec: -36.0, brightness: 0.6 },
      { ra: 259.5, dec: -34.2, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    color: 0xef5350
  },
  {
    id: 'ji', name: '箕宿', pinyin: 'jisu', constellation: '东方苍龙七宿',
    description: '箕宿四星，为苍龙之尾末，主口舌、谗谤、风伯。箕宿好风，主八风、五音、讴谣、客馆。',
    stars: [
      { ra: 270.0, dec: -26.4, brightness: 0.85 },
      { ra: 271.2, dec: -29.8, brightness: 0.7 },
      { ra: 272.5, dec: -23.8, brightness: 0.6 },
      { ra: 273.8, dec: -27.2, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [2, 3], [1, 3]],
    color: 0xec407a
  },
  {
    id: 'dou', name: '斗宿', pinyin: 'dousu', constellation: '北方玄武七宿',
    description: '斗宿六星，为玄武之蛇身，为南斗，主寿、禄、爵、赏。南斗六星君主天子寿命、宰相爵禄之位。',
    stars: [
      { ra: 281.0, dec: -29.6, brightness: 0.85 },
      { ra: 282.5, dec: -26.1, brightness: 0.8 },
      { ra: 284.0, dec: -28.5, brightness: 0.7 },
      { ra: 285.2, dec: -24.8, brightness: 0.65 },
      { ra: 286.8, dec: -27.5, brightness: 0.55 },
      { ra: 287.5, dec: -22.0, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 2], [2, 4], [1, 3], [3, 5]],
    color: 0x7986cb
  },
  {
    id: 'niu', name: '牛宿', pinyin: 'niusù', constellation: '北方玄武七宿',
    description: '牛宿六星，为玄武之牛身，主牺牲、牧养、农耕。牛宿为牵牛，主桥梁、道路、关梁、驿亭。',
    stars: [
      { ra: 297.5, dec: 5.9, brightness: 0.8 },
      { ra: 298.8, dec: 2.8, brightness: 0.7 },
      { ra: 299.5, dec: 8.2, brightness: 0.55 },
      { ra: 300.2, dec: 5.0, brightness: 0.5 },
      { ra: 301.5, dec: 3.5, brightness: 0.45 },
      { ra: 296.5, dec: 6.8, brightness: 0.4 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [3, 4], [0, 5]],
    color: 0x5c6bc0
  },
  {
    id: 'nü', name: '女宿', pinyin: 'nüsù', constellation: '北方玄武七宿',
    description: '女宿四星，为玄武之女身，为须女，主妇功、女工、布帛。女宿主嫁娶、生育、后宫、阴事。',
    stars: [
      { ra: 311.0, dec: 20.8, brightness: 0.85 },
      { ra: 312.5, dec: 18.5, brightness: 0.75 },
      { ra: 313.8, dec: 22.0, brightness: 0.55 },
      { ra: 314.5, dec: 19.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 3], [0, 2], [2, 3]],
    color: 0x3f51b5
  },
  {
    id: 'xu', name: '虚宿', pinyin: 'xusu', constellation: '北方玄武七宿',
    description: '虚宿二星，为玄武之龟身，主庙堂、祭祀、丧事、哭泣。虚宿为冢宰之官，主死丧哀泣，又主北方水事。',
    stars: [
      { ra: 321.5, dec: -5.9, brightness: 0.9 },
      { ra: 323.0, dec: -8.2, brightness: 0.75 },
      { ra: 320.0, dec: -3.0, brightness: 0.5 },
      { ra: 324.5, dec: -6.5, brightness: 0.45 }
    ],
    connections: [[0, 1], [0, 2], [1, 3]],
    color: 0x3949ab
  },
  {
    id: 'wei2', name: '危宿', pinyin: 'weisù', constellation: '北方玄武七宿',
    description: '危宿三星，为玄武之龟盖，主房屋、宗庙、祭祀。危宿为栋宇之官，主天市、架屋、盖房、土功。',
    stars: [
      { ra: 332.0, dec: -18.5, brightness: 0.85 },
      { ra: 334.0, dec: -15.5, brightness: 0.75 },
      { ra: 336.0, dec: -17.8, brightness: 0.65 },
      { ra: 333.5, dec: -20.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 2], [0, 3]],
    color: 0x303f9f
  },
  {
    id: 'shi', name: '室宿', pinyin: 'shisù', constellation: '北方玄武七宿',
    description: '室宿二星，为玄武之龟体，主营室、军旅、土木工程。室宿为太庙，天子之宫，主土功、田猎、休息。',
    stars: [
      { ra: 350.5, dec: 11.2, brightness: 0.85 },
      { ra: 352.0, dec: 13.8, brightness: 0.8 },
      { ra: 348.5, dec: 8.5, brightness: 0.6 },
      { ra: 354.0, dec: 15.5, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [1, 3]],
    color: 0x283593
  },
  {
    id: 'bi', name: '壁宿', pinyin: 'bisù', constellation: '北方玄武七宿',
    description: '壁宿二星，为玄武之龟尾，主文章、图书、秘府。壁宿为东壁，主文章、图书、秘籍，天下图书之秘府。',
    stars: [
      { ra: 3.3, dec: 27.3, brightness: 0.85 },
      { ra: 5.5, dec: 28.6, brightness: 0.75 },
      { ra: 2.0, dec: 24.5, brightness: 0.55 },
      { ra: 6.8, dec: 30.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [0, 2], [1, 3]],
    color: 0x1a237e
  },
  {
    id: 'kui', name: '奎宿', pinyin: 'kuísu', constellation: '西方白虎七宿',
    description: '奎宿十六星，为白虎之足，主文章、图书、秘府、武库。奎宿为封豕，主兵甲、武库、库兵、大水。',
    stars: [
      { ra: 22.5, dec: 34.7, brightness: 0.85 },
      { ra: 24.0, dec: 31.8, brightness: 0.75 },
      { ra: 25.5, dec: 35.5, brightness: 0.7 },
      { ra: 27.0, dec: 33.0, brightness: 0.65 },
      { ra: 23.5, dec: 29.0, brightness: 0.55 },
      { ra: 28.5, dec: 36.2, brightness: 0.5 }
    ],
    connections: [[0, 1], [0, 2], [2, 3], [1, 4], [3, 5]],
    color: 0xffd54f
  },
  {
    id: 'lou', name: '娄宿', pinyin: 'lousu', constellation: '西方白虎七宿',
    description: '娄宿三星，为白虎之腹，主苑牧、牺牲、祭祀、兴兵聚众。娄宿为牧苑之官，主牺牲、宗庙、社稷。',
    stars: [
      { ra: 33.8, dec: 27.5, brightness: 0.85 },
      { ra: 35.5, dec: 25.0, brightness: 0.75 },
      { ra: 34.5, dec: 29.8, brightness: 0.6 }
    ],
    connections: [[0, 1], [0, 2], [1, 2]],
    color: 0xffa726
  },
  {
    id: 'wei3', name: '胃宿', pinyin: 'wèisu', constellation: '西方白虎七宿',
    description: '胃宿三星，为白虎之胸胃，主仓廪、五谷、府藏、积聚。胃宿为天子之仓，主五谷、丝帛、财物、库藏。',
    stars: [
      { ra: 44.5, dec: 27.0, brightness: 0.85 },
      { ra: 45.8, dec: 24.8, brightness: 0.7 },
      { ra: 46.5, dec: 28.5, brightness: 0.6 }
    ],
    connections: [[0, 1], [0, 2], [1, 2]],
    color: 0xff9800
  },
  {
    id: 'ang', name: '昴宿', pinyin: 'mǎosu', constellation: '西方白虎七宿',
    description: '昴宿七星，为白虎之毛，主髦头、胡兵、狱事、口舌。昴宿为旄头，主西方之宿，主丧、狱、胡、戎。',
    stars: [
      { ra: 56.5, dec: 24.1, brightness: 0.85 },
      { ra: 57.2, dec: 22.8, brightness: 0.8 },
      { ra: 55.8, dec: 26.0, brightness: 0.75 },
      { ra: 58.0, dec: 25.5, brightness: 0.7 },
      { ra: 56.0, dec: 21.5, brightness: 0.65 },
      { ra: 58.5, dec: 23.0, brightness: 0.6 },
      { ra: 54.5, dec: 23.5, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [1, 4], [3, 5], [0, 6]],
    color: 0xfb8c00
  },
  {
    id: 'bi4', name: '毕宿', pinyin: 'bisù', constellation: '西方白虎七宿',
    description: '毕宿八星，为白虎之爪，主畋猎、边兵、刑罚、雨师。毕宿为罕车，主弋猎、边兵、刑罚，毕星好雨。',
    stars: [
      { ra: 68.5, dec: 16.5, brightness: 0.85 },
      { ra: 69.8, dec: 18.8, brightness: 0.8 },
      { ra: 70.5, dec: 14.2, brightness: 0.75 },
      { ra: 71.8, dec: 17.5, brightness: 0.7 },
      { ra: 72.5, dec: 13.0, brightness: 0.6 },
      { ra: 67.0, dec: 15.8, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 4], [0, 5]],
    color: 0xf57c00
  },
  {
    id: 'zui', name: '觜宿', pinyin: 'zisu', constellation: '西方白虎七宿',
    description: '觜宿三星，为白虎之头口，主收敛、万物、军旅。觜宿为虎首，主军旅、收敛、葆旅、万物。',
    stars: [
      { ra: 83.5, dec: 9.5, brightness: 0.75 },
      { ra: 84.8, dec: 6.8, brightness: 0.65 },
      { ra: 82.0, dec: 7.5, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [1, 2]],
    color: 0xef6c00
  },
  {
    id: 'shen', name: '参宿', pinyin: 'shensu', constellation: '西方白虎七宿',
    description: '参宿七星，为白虎之前身，主斩刈、权衡、大将。参宿为西方宿，主军事、征伐、杀伐，参宿七星中有三星为参宿腰带。',
    stars: [
      { ra: 88.8, dec: -8.2, brightness: 0.9 },
      { ra: 91.5, dec: -5.9, brightness: 1.0 },
      { ra: 92.0, dec: -10.5, brightness: 0.95 },
      { ra: 89.5, dec: -1.9, brightness: 0.7 },
      { ra: 90.8, dec: -2.5, brightness: 0.75 },
      { ra: 92.2, dec: -3.1, brightness: 0.7 },
      { ra: 87.5, dec: -4.5, brightness: 0.6 }
    ],
    connections: [[0, 1], [1, 2], [0, 6], [1, 4], [3, 4], [4, 5]],
    color: 0xe65100
  },
  {
    id: 'jing', name: '井宿', pinyin: 'jingsu', constellation: '南方朱雀七宿',
    description: '井宿八星，为朱雀之首，主水事、法令、酒旗。井宿为南门，主水衡、法令、公平、贤士。',
    stars: [
      { ra: 111.5, dec: 10.2, brightness: 0.85 },
      { ra: 113.0, dec: 13.5, brightness: 0.8 },
      { ra: 114.5, dec: 8.5, brightness: 0.75 },
      { ra: 115.8, dec: 12.0, brightness: 0.7 },
      { ra: 112.5, dec: 6.0, brightness: 0.65 },
      { ra: 116.5, dec: 15.0, brightness: 0.6 },
      { ra: 110.0, dec: 12.5, brightness: 0.55 },
      { ra: 117.8, dec: 9.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [0, 4], [1, 3], [2, 3], [1, 5], [0, 6], [3, 7]],
    color: 0x4dd0e1
  },
  {
    id: 'gui', name: '鬼宿', pinyin: 'guǐsu', constellation: '南方朱雀七宿',
    description: '鬼宿四星，为朱雀之目，主祠祀、死亡、疾病。鬼宿为天目，主祭祀、死亡、疾病、妖祥，中央一星为积尸气。',
    stars: [
      { ra: 128.5, dec: 11.8, brightness: 0.85 },
      { ra: 129.8, dec: 14.5, brightness: 0.75 },
      { ra: 127.2, dec: 13.5, brightness: 0.65 },
      { ra: 130.5, dec: 12.0, brightness: 0.6 },
      { ra: 129.0, dec: 13.0, brightness: 0.5 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4], [1, 4]],
    color: 0x26c6da
  },
  {
    id: 'liu', name: '柳宿', pinyin: 'liǔsu', constellation: '南方朱雀七宿',
    description: '柳宿八星，为朱雀之喙，主草木、膳食、酒食。柳宿为朱雀之口，主饮食、仓库、庖厨、木果。',
    stars: [
      { ra: 139.5, dec: -1.8, brightness: 0.8 },
      { ra: 140.8, dec: -4.2, brightness: 0.7 },
      { ra: 142.0, dec: -2.5, brightness: 0.65 },
      { ra: 141.5, dec: 0.5, brightness: 0.6 },
      { ra: 143.5, dec: -0.8, brightness: 0.55 },
      { ra: 138.5, dec: -0.5, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 2], [0, 5], [2, 3], [2, 4]],
    color: 0x00bcd4
  },
  {
    id: 'xing', name: '星宿', pinyin: 'xīngsù', constellation: '南方朱雀七宿',
    description: '星宿七星，为朱雀之颈，主衣服、文章、太阳。星宿为七星，主衣裳、文绣、太阳、光明、贤士。',
    stars: [
      { ra: 152.5, dec: -18.5, brightness: 0.95 },
      { ra: 153.8, dec: -16.2, brightness: 0.75 },
      { ra: 154.5, dec: -20.5, brightness: 0.7 },
      { ra: 155.8, dec: -17.5, brightness: 0.65 },
      { ra: 151.0, dec: -15.8, brightness: 0.55 },
      { ra: 156.5, dec: -14.5, brightness: 0.5 },
      { ra: 157.2, dec: -19.0, brightness: 0.45 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4], [3, 5], [2, 6]],
    color: 0x00acc1
  },
  {
    id: 'zhang', name: '张宿', pinyin: 'zhāngsù', constellation: '南方朱雀七宿',
    description: '张宿六星，为朱雀之嗉，主珍宝、宗庙、天厨。张宿为朱雀之嗉，主宗庙、天子、嫔御、赏赐。',
    stars: [
      { ra: 165.5, dec: -32.8, brightness: 0.8 },
      { ra: 166.8, dec: -30.5, brightness: 0.75 },
      { ra: 168.0, dec: -34.2, brightness: 0.7 },
      { ra: 169.5, dec: -31.5, brightness: 0.65 },
      { ra: 164.0, dec: -31.0, brightness: 0.55 },
      { ra: 170.8, dec: -33.0, brightness: 0.5 }
    ],
    connections: [[0, 1], [1, 3], [0, 2], [0, 4], [3, 5]],
    color: 0x0097a7
  },
  {
    id: 'yi', name: '翼宿', pinyin: 'yisu', constellation: '南方朱雀七宿',
    description: '翼宿二十二星，为朱雀之翼翮，主俳倡、戏乐、蛮夷。翼宿为羽翼，主远夷、宾客、俳倡、戏乐、文章。',
    stars: [
      { ra: 181.5, dec: -23.5, brightness: 0.85 },
      { ra: 183.0, dec: -26.0, brightness: 0.75 },
      { ra: 184.5, dec: -21.5, brightness: 0.7 },
      { ra: 185.8, dec: -24.8, brightness: 0.65 },
      { ra: 186.5, dec: -20.0, brightness: 0.6 },
      { ra: 187.8, dec: -23.0, brightness: 0.55 }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5]],
    color: 0x00838f
  },
  {
    id: 'zhen', name: '轸宿', pinyin: 'zhěnsù', constellation: '南方朱雀七宿',
    description: '轸宿四星，为朱雀之尾，主车骑、载任、丧葬。轸宿为车，主载任、有司、大车、丧事、冢宰。',
    stars: [
      { ra: 194.5, dec: -17.5, brightness: 0.85 },
      { ra: 196.0, dec: -14.8, brightness: 0.75 },
      { ra: 197.5, dec: -18.5, brightness: 0.7 },
      { ra: 198.8, dec: -15.5, brightness: 0.65 },
      { ra: 193.0, dec: -16.0, brightness: 0.55 }
    ],
    connections: [[0, 1], [1, 3], [0, 2], [2, 3], [0, 4]],
    color: 0x006064
  }
];

function raDecToVector(ra: number, dec: number, radius: number): THREE.Vector3 {
  const raRad = THREE.MathUtils.degToRad(ra);
  const decRad = THREE.MathUtils.degToRad(dec);
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);
  const y = radius * Math.sin(decRad);
  return new THREE.Vector3(x, y, z);
}

export class StarField {
  public scene: THREE.Scene;
  public labelRenderer: CSS2DRenderer;
  public starOfficials: StarOfficial[] = [];
  public galaxyCloud: THREE.Points;
  public allStarPositions: Float32Array;
  public allStarColors: Float32Array;
  public allStarSizes: Float32Array;
  public allStars: THREE.Points;
  private starIndexMap: Map<number, { official: StarOfficial; localIndex: number }> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.id = 'label-container';
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';

    this.createBackground();
    this.createGalaxyCloud();
    this.createStarOfficials();
    this.createAmbientHalo();
  }

  private createBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    gradient.addColorStop(0, '#1a1a3a');
    gradient.addColorStop(0.5, '#0f0f2a');
    gradient.addColorStop(1, '#050515');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    const backgroundGeom = new THREE.SphereGeometry(500, 32, 32);
    const backgroundMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false
    });
    const background = new THREE.Mesh(backgroundGeom, backgroundMat);
    this.scene.add(background);
  }

  private createGalaxyCloud(): void {
    const galaxyCount = 3000;
    const positions = new Float32Array(galaxyCount * 3);
    const colors = new Float32Array(galaxyCount * 3);

    for (let i = 0; i < galaxyCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 350 + Math.random() * 100;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        colors[i * 3] = 0.5;
        colors[i * 3 + 1] = 0.6;
        colors[i * 3 + 2] = 0.9;
      } else {
        colors[i * 3] = 0.7;
        colors[i * 3 + 1] = 0.5;
        colors[i * 3 + 2] = 0.9;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.galaxyCloud = new THREE.Points(geometry, material);
    this.scene.add(this.galaxyCloud);
  }

  private createStarOfficials(): void {
    let totalStars = 0;
    STAR_OFFICIALS_DATA.forEach(official => {
      totalStars += official.stars.length;
    });

    this.allStarPositions = new Float32Array(totalStars * 3);
    this.allStarColors = new Float32Array(totalStars * 3);
    this.allStarSizes = new Float32Array(totalStars);

    let globalIndex = 0;

    STAR_OFFICIALS_DATA.forEach((officialData) => {
      const group = new THREE.Group();
      const positions: THREE.Vector3[] = [];

      const localPositions = new Float32Array(officialData.stars.length * 3);
      const localColors = new Float32Array(officialData.stars.length * 3);
      const localSizes = new Float32Array(officialData.stars.length);

      const baseColor = new THREE.Color(officialData.color);

      officialData.stars.forEach((star, i) => {
        const pos = raDecToVector(star.ra, star.dec, SPHERE_RADIUS);
        positions.push(pos);

        localPositions[i * 3] = pos.x;
        localPositions[i * 3 + 1] = pos.y;
        localPositions[i * 3 + 2] = pos.z;

        this.allStarPositions[globalIndex * 3] = pos.x;
        this.allStarPositions[globalIndex * 3 + 1] = pos.y;
        this.allStarPositions[globalIndex * 3 + 2] = pos.z;

        const brightnessFactor = star.brightness;
        localColors[i * 3] = baseColor.r * brightnessFactor;
        localColors[i * 3 + 1] = baseColor.g * brightnessFactor;
        localColors[i * 3 + 2] = baseColor.b * brightnessFactor;

        this.allStarColors[globalIndex * 3] = baseColor.r * brightnessFactor;
        this.allStarColors[globalIndex * 3 + 1] = baseColor.g * brightnessFactor;
        this.allStarColors[globalIndex * 3 + 2] = baseColor.b * brightnessFactor;

        const size = 1.5 + star.brightness * 2;
        localSizes[i] = size;
        this.allStarSizes[globalIndex] = size;

        this.starIndexMap.set(globalIndex, { official: null as any, localIndex: i });
        globalIndex++;
      });

      const pointGeom = new THREE.BufferGeometry();
      pointGeom.setAttribute('position', new THREE.BufferAttribute(localPositions, 3));
      pointGeom.setAttribute('color', new THREE.BufferAttribute(localColors, 3));

      const pointMat = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const points = new THREE.Points(pointGeom, pointMat);
      group.add(points);

      const lines: THREE.Line[] = [];
      officialData.connections.forEach(([from, to]) => {
        if (from < positions.length && to < positions.length) {
          const curve = new THREE.QuadraticBezierCurve3(
            positions[from],
            positions[from].clone().add(positions[to]).multiplyScalar(0.5).normalize().multiplyScalar(SPHERE_RADIUS * 1.05),
            positions[to]
          );
          const pointsOnCurve = curve.getPoints(20);
          const lineGeom = new THREE.BufferGeometry().setFromPoints(pointsOnCurve);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xccccff,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const line = new THREE.Line(lineGeom, lineMat);
          lines.push(line);
          group.add(line);
        }
      });

      const centerPos = new THREE.Vector3();
      positions.forEach(p => centerPos.add(p));
      centerPos.multiplyScalar(1 / positions.length).normalize().multiplyScalar(SPHERE_RADIUS * 1.15);

      const labelDiv = document.createElement('div');
      labelDiv.className = 'star-label';
      labelDiv.textContent = officialData.name;
      const label = new CSS2DObject(labelDiv);
      label.position.copy(centerPos);
      group.add(label);

      this.scene.add(group);

      const official: StarOfficial = {
        data: officialData,
        positions,
        group,
        points,
        lines,
        label,
        originalColors: new Float32Array(localColors)
      };

      this.starOfficials.push(official);
    });

    this.starIndexMap.forEach((value, key) => {
      const officialIdx = Math.floor(key / 5);
      const official = this.starOfficials[officialIdx] || this.starOfficials[0];
      value.official = official;
    });

    this.rebuildStarIndexMap();
  }

  private rebuildStarIndexMap(): void {
    this.starIndexMap.clear();
    let globalIndex = 0;
    this.starOfficials.forEach(official => {
      official.data.stars.forEach((_star, localIndex) => {
        this.starIndexMap.set(globalIndex, { official, localIndex });
        globalIndex++;
      });
    });
  }

  private createAmbientHalo(): void {
    const haloGeom = new THREE.SphereGeometry(SPHERE_RADIUS * 1.02, 64, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    this.scene.add(halo);
  }

  public getStarOfficialByIndex(index: number): StarOfficial | null {
    const mapped = this.starIndexMap.get(index);
    return mapped ? mapped.official : null;
  }

  public hoverStarOfficial(official: StarOfficial | null): void {
    this.starOfficials.forEach(off => {
      const labelEl = off.label.element as HTMLElement;
      if (off === official) {
        labelEl.classList.add('hovered');
        (off.points.material as THREE.PointsMaterial).size = 4.5;
      } else {
        labelEl.classList.remove('hovered');
        (off.points.material as THREE.PointsMaterial).size = 3;
      }
    });
  }

  public highlightStarOfficial(official: StarOfficial | null): void {
    this.starOfficials.forEach(off => {
      const colors = off.points.geometry.attributes.color as THREE.BufferAttribute;
      const colorArray = colors.array as Float32Array;

      if (off === official) {
        for (let i = 0; i < colorArray.length; i += 3) {
          colorArray[i] = 1.0;
          colorArray[i + 1] = 0.843;
          colorArray[i + 2] = 0.0;
        }
        (off.points.material as THREE.PointsMaterial).size = 6;
        off.lines.forEach(line => {
          (line.material as THREE.LineBasicMaterial).opacity = 0.8;
          (line.material as THREE.LineBasicMaterial).color.setHex(0xffd700);
        });
      } else {
        colorArray.set(off.originalColors);
        (off.points.material as THREE.PointsMaterial).size = 3;
        off.lines.forEach(line => {
          (line.material as THREE.LineBasicMaterial).opacity = 0.35;
          (line.material as THREE.LineBasicMaterial).color.setHex(0xccccff);
        });
      }
      colors.needsUpdate = true;
    });
  }

  public animate(time: number): void {
    this.galaxyCloud.rotation.y = time * 0.00002;
    this.galaxyCloud.rotation.x = Math.sin(time * 0.00001) * 0.1;

    const flickerFrequency = 0.5;
    this.starOfficials.forEach(official => {
      (official.points.material as THREE.PointsMaterial).opacity =
        0.85 + Math.sin(time * 0.001 * flickerFrequency * Math.PI * 2) * 0.1;
    });
  }

  public resize(width: number, height: number): void {
    this.labelRenderer.setSize(width, height);
  }

  public searchStarOfficials(query: string): StarOfficial[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    return this.starOfficials.filter(off => {
      return off.data.name.includes(query) ||
        off.data.pinyin.toLowerCase().includes(lowerQuery) ||
        off.data.constellation.includes(query);
    }).slice(0, 8);
  }

  public getCenterPosition(official: StarOfficial): THREE.Vector3 {
    const center = new THREE.Vector3();
    official.positions.forEach(p => center.add(p));
    center.multiplyScalar(1 / official.positions.length);
    return center;
  }
}
