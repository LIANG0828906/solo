import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface StarOfficialData {
  id: string;
  name: string;
  pinyin: string;
  englishName: string;
  constellation: string;
  description: string;
  stars: { ra: number; dec: number; brightness: number; name?: string }[];
  connections: [number, number][];
  color: number;
}

export interface StarOfficial {
  data: StarOfficialData;
  positions: THREE.Vector3[];
  group: THREE.Group;
  points: THREE.Points;
  glowPoints: THREE.Points;
  lines: THREE.Line[];
  label: CSS2DObject;
  originalColors: Float32Array;
  targetSize: number;
  currentSize: number;
}

const SPHERE_RADIUS = 100;
const DEFAULT_STAR_SIZE = 3;
const HOVER_STAR_SIZE = 4.5;
const HIGHLIGHT_STAR_SIZE = 6;
const LERP_FACTOR = 0.18;

export const STAR_OFFICIALS_DATA: StarOfficialData[] = [
  {
    id: 'jiao', name: '角宿', pinyin: 'jiaosu', englishName: 'Horn', constellation: '东方苍龙七宿',
    description: '角宿二星，为苍龙之角，主造化万物，传布阳气，主春耕、农桑、造化。角宿一为室女座α，是全天第十七亮星。',
    stars: [
      { ra: 201.298, dec: -11.161, brightness: 1.0, name: '角宿一(室女座α)' },
      { ra: 203.417, dec: -11.573, brightness: 0.65, name: '角宿二(室女座ζ)' },
      { ra: 199.817, dec: -9.475, brightness: 0.5, name: '角宿增一(室女座ι)' },
      { ra: 202.5, dec: -10.8, brightness: 0.4, name: '角宿增三' },
      { ra: 200.0, dec: -12.2, brightness: 0.35, name: '角宿增四' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4]],
    color: 0x4fc3f7
  },
  {
    id: 'kang', name: '亢宿', pinyin: 'kangsù', englishName: 'Neck', constellation: '东方苍龙七宿',
    description: '亢宿四星，为苍龙之前颈，主朝廷、庙殿、君臣、礼法。亢宿象征天子之内朝，总摄天下奏事。',
    stars: [
      { ra: 213.227, dec: -10.270, brightness: 0.85, name: '亢宿一(室女座κ)' },
      { ra: 215.064, dec: -5.815, brightness: 0.7, name: '亢宿二(室女座ι)' },
      { ra: 214.668, dec: -13.513, brightness: 0.6, name: '亢宿三(室女座φ)' },
      { ra: 217.444, dec: -9.708, brightness: 0.55, name: '亢宿四(室女座λ)' },
      { ra: 212.0, dec: -8.5, brightness: 0.4, name: '亢宿增一' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4]],
    color: 0x81c784
  },
  {
    id: 'di', name: '氐宿', pinyin: 'disu', englishName: 'Root', constellation: '东方苍龙七宿',
    description: '氐宿四星，为苍龙之前胸，主后妃之府、妾媵之室。氐宿为天子之路寝，又主疫疾、灾病。',
    stars: [
      { ra: 222.693, dec: -16.042, brightness: 0.85, name: '氐宿一(天秤座α)' },
      { ra: 228.182, dec: -14.790, brightness: 0.75, name: '氐宿二(天秤座γ)' },
      { ra: 225.629, dec: -19.513, brightness: 0.65, name: '氐宿三(天秤座β)' },
      { ra: 230.226, dec: -16.819, brightness: 0.55, name: '氐宿四(天秤座δ)' },
      { ra: 227.0, dec: -12.0, brightness: 0.45, name: '氐宿增一' },
      { ra: 224.0, dec: -17.5, brightness: 0.4, name: '氐宿增二' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4], [2, 5]],
    color: 0xaed581
  },
  {
    id: 'fang', name: '房宿', pinyin: 'fangsu', englishName: 'Room', constellation: '东方苍龙七宿',
    description: '房宿四星，为苍龙之腹，为明堂，天子布政之宫。房宿主车马、驿传、仓储、府藏，又为四辅之官。',
    stars: [
      { ra: 239.717, dec: -26.432, brightness: 0.85, name: '房宿一(天蝎座π)' },
      { ra: 242.786, dec: -29.107, brightness: 0.75, name: '房宿二(天蝎座ρ)' },
      { ra: 240.532, dec: -22.958, brightness: 0.65, name: '房宿三(天蝎座δ)' },
      { ra: 244.234, dec: -25.724, brightness: 0.7, name: '房宿四(天蝎座β)' },
      { ra: 241.5, dec: -27.8, brightness: 0.5, name: '房宿增一' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4]],
    color: 0xffb74d
  },
  {
    id: 'xin', name: '心宿', pinyin: 'xinsu', englishName: 'Heart', constellation: '东方苍龙七宿',
    description: '心宿三星，为苍龙之心，中央大星为天王，前后二星为庶子。心宿主火星、明堂、祭祀，大火星为古代授时标准星。',
    stars: [
      { ra: 245.292, dec: -25.584, brightness: 0.85, name: '心宿一(天蝎座σ)' },
      { ra: 247.352, dec: -26.432, brightness: 1.0, name: '心宿二(天蝎座α 心宿二)' },
      { ra: 248.417, dec: -28.135, brightness: 0.8, name: '心宿三(天蝎座τ)' },
      { ra: 246.5, dec: -24.0, brightness: 0.5, name: '心宿增一' },
      { ra: 249.0, dec: -25.0, brightness: 0.45, name: '心宿增二' }
    ],
    connections: [[0, 1], [1, 2], [0, 3], [2, 4]],
    color: 0xff8a65
  },
  {
    id: 'wei', name: '尾宿', pinyin: 'weisù', englishName: 'Tail', constellation: '东方苍龙七宿',
    description: '尾宿九星，为苍龙之尾，主后宫、九子、君臣、后妃。尾宿为九江口，主水事，又主盗贼、奸佞。',
    stars: [
      { ra: 252.892, dec: -38.060, brightness: 0.75, name: '尾宿一(天蝎座μ)' },
      { ra: 255.698, dec: -34.206, brightness: 0.8, name: '尾宿二(天蝎座ε)' },
      { ra: 257.529, dec: -34.708, brightness: 0.7, name: '尾宿三(天蝎座ζ)' },
      { ra: 260.192, dec: -32.972, brightness: 0.65, name: '尾宿四(天蝎座η)' },
      { ra: 264.371, dec: -43.001, brightness: 0.85, name: '尾宿五(天蝎座θ)' },
      { ra: 263.402, dec: -37.104, brightness: 0.9, name: '尾宿八(天蝎座λ)' },
      { ra: 262.0, dec: -39.5, brightness: 0.6, name: '尾宿七(天蝎座κ)' }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 5], [5, 4], [3, 6]],
    color: 0xef5350
  },
  {
    id: 'ji', name: '箕宿', pinyin: 'jisu', englishName: 'Winnowing Basket', constellation: '东方苍龙七宿',
    description: '箕宿四星，为苍龙之尾末，主口舌、谗谤、风伯。箕宿好风，主八风、五音、讴谣、客馆。',
    stars: [
      { ra: 271.319, dec: -30.456, brightness: 0.8, name: '箕宿一(人马座γ)' },
      { ra: 274.094, dec: -30.740, brightness: 0.7, name: '箕宿二(人马座δ)' },
      { ra: 276.092, dec: -34.384, brightness: 0.85, name: '箕宿三(人马座ε)' },
      { ra: 273.565, dec: -36.720, brightness: 0.6, name: '箕宿四(人马座η)' },
      { ra: 272.5, dec: -28.0, brightness: 0.45, name: '箕宿增一' }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [0, 3], [0, 4]],
    color: 0xec407a
  },
  {
    id: 'dou', name: '斗宿', pinyin: 'dousu', englishName: 'Dipper', constellation: '北方玄武七宿',
    description: '斗宿六星，为玄武之蛇身，为南斗，主寿、禄、爵、赏。南斗六星君主天子寿命、宰相爵禄之位。',
    stars: [
      { ra: 279.908, dec: -27.056, brightness: 0.75, name: '斗宿一(人马座φ)' },
      { ra: 281.694, dec: -25.373, brightness: 0.7, name: '斗宿二(人马座λ)' },
      { ra: 282.571, dec: -21.167, brightness: 0.65, name: '斗宿三(人马座μ)' },
      { ra: 283.887, dec: -26.297, brightness: 0.8, name: '斗宿四(人马座σ Nunki)' },
      { ra: 285.712, dec: -27.332, brightness: 0.6, name: '斗宿五(人马座τ)' },
      { ra: 284.138, dec: -29.477, brightness: 0.7, name: '斗宿六(人马座ζ)' }
    ],
    connections: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [0, 5]],
    color: 0x7986cb
  },
  {
    id: 'niu', name: '牛宿', pinyin: 'niusù', englishName: 'Ox', constellation: '北方玄武七宿',
    description: '牛宿六星，为玄武之牛身，主牺牲、牧养、农耕。牛宿为牵牛，主桥梁、道路、关梁、驿亭。',
    stars: [
      { ra: 305.267, dec: -14.780, brightness: 0.8, name: '牛宿一(摩羯座β)' },
      { ra: 307.261, dec: -12.746, brightness: 0.7, name: '牛宿二(摩羯座α)' },
      { ra: 302.533, dec: -22.272, brightness: 0.6, name: '牛宿三(摩羯座ξ)' },
      { ra: 304.342, dec: -18.750, brightness: 0.55, name: '牛宿四(摩羯座π)' },
      { ra: 308.173, dec: -18.329, brightness: 0.5, name: '牛宿五(摩羯座ο)' },
      { ra: 300.894, dec: -15.564, brightness: 0.45, name: '牛宿六(摩羯座ρ)' }
    ],
    connections: [[0, 1], [0, 2], [2, 3], [3, 4], [0, 5], [1, 4]],
    color: 0x5c6bc0
  },
  {
    id: 'nü', name: '女宿', pinyin: 'nüsù', englishName: 'Girl', constellation: '北方玄武七宿',
    description: '女宿四星，为玄武之女身，为须女，主妇功、女工、布帛。女宿主嫁娶、生育、后宫、阴事。',
    stars: [
      { ra: 311.952, dec: -9.488, brightness: 0.8, name: '女宿一(宝瓶座ε Albali)' },
      { ra: 314.842, dec: -8.847, brightness: 0.7, name: '女宿二(宝瓶座μ)' },
      { ra: 310.0, dec: -5.0, brightness: 0.55, name: '女宿三(宝瓶座4)' },
      { ra: 316.5, dec: -6.5, brightness: 0.5, name: '女宿四(宝瓶座3)' },
      { ra: 313.0, dec: -11.2, brightness: 0.45, name: '女宿增一' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4]],
    color: 0x3f51b5
  },
  {
    id: 'xu', name: '虚宿', pinyin: 'xusu', englishName: 'Emptiness', constellation: '北方玄武七宿',
    description: '虚宿二星，为玄武之龟身，主庙堂、祭祀、丧事、哭泣。虚宿为冢宰之官，主死丧哀泣，又主北方水事。',
    stars: [
      { ra: 322.893, dec: -5.573, brightness: 0.85, name: '虚宿一(宝瓶座β Sadalsuud)' },
      { ra: 329.669, dec: 5.778, brightness: 0.75, name: '虚宿二(小马座α)' },
      { ra: 325.5, dec: -3.0, brightness: 0.5, name: '虚宿增一' },
      { ra: 328.0, dec: 2.5, brightness: 0.45, name: '虚宿增二' },
      { ra: 320.0, dec: -7.5, brightness: 0.4, name: '虚宿增三' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4]],
    color: 0x3949ab
  },
  {
    id: 'wei2', name: '危宿', pinyin: 'weisù', englishName: 'Rooftop', constellation: '北方玄武七宿',
    description: '危宿三星，为玄武之龟盖，主房屋、宗庙、祭祀。危宿为栋宇之官，主天市、架屋、盖房、土功。',
    stars: [
      { ra: 333.766, dec: -0.072, brightness: 0.8, name: '危宿一(宝瓶座α Sadalmelik)' },
      { ra: 345.046, dec: 6.193, brightness: 0.7, name: '危宿二(飞马座θ)' },
      { ra: 347.995, dec: 9.875, brightness: 0.75, name: '危宿三(飞马座ε Enif)' },
      { ra: 340.0, dec: 3.0, brightness: 0.5, name: '危宿增一' },
      { ra: 346.5, dec: 12.5, brightness: 0.45, name: '危宿增二' }
    ],
    connections: [[0, 1], [1, 2], [0, 3], [2, 4]],
    color: 0x303f9f
  },
  {
    id: 'shi', name: '室宿', pinyin: 'shisù', englishName: 'House', constellation: '北方玄武七宿',
    description: '室宿二星，为玄武之龟体，主营室、军旅、土木工程。室宿为太庙，天子之宫，主土功、田猎、休息。',
    stars: [
      { ra: 346.179, dec: 15.205, brightness: 0.85, name: '室宿一(飞马座α Markab)' },
      { ra: 352.696, dec: 28.084, brightness: 0.8, name: '室宿二(飞马座β Scheat)' },
      { ra: 344.350, dec: 12.130, brightness: 0.55, name: '室宿增一(飞马座π)' },
      { ra: 350.0, dec: 20.0, brightness: 0.5, name: '室宿增二' },
      { ra: 348.0, dec: 17.5, brightness: 0.45, name: '室宿增三' },
      { ra: 355.0, dec: 25.0, brightness: 0.4, name: '室宿增四' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5]],
    color: 0x283593
  },
  {
    id: 'bi', name: '壁宿', pinyin: 'bisù', englishName: 'Wall', constellation: '北方玄武七宿',
    description: '壁宿二星，为玄武之龟尾，主文章、图书、秘府。壁宿为东壁，主文章、图书、秘籍，天下图书之秘府。',
    stars: [
      { ra: 3.004, dec: 15.184, brightness: 0.85, name: '壁宿一(飞马座γ Algenib)' },
      { ra: 0.138, dec: 29.090, brightness: 0.8, name: '壁宿二(仙女座α Alpheratz)' },
      { ra: 5.0, dec: 18.0, brightness: 0.5, name: '壁宿增一' },
      { ra: 358.0, dec: 25.0, brightness: 0.45, name: '壁宿增二' },
      { ra: 1.5, dec: 22.0, brightness: 0.4, name: '壁宿增三' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [1, 4]],
    color: 0x1a237e
  },
  {
    id: 'kui', name: '奎宿', pinyin: 'kuísu', englishName: 'Legs', constellation: '西方白虎七宿',
    description: '奎宿十六星，为白虎之足，主文章、图书、秘府、武库。奎宿为封豕，主兵甲、武库、库兵、大水。',
    stars: [
      { ra: 6.449, dec: 22.950, brightness: 0.75, name: '奎宿一(仙女座η)' },
      { ra: 8.729, dec: 24.462, brightness: 0.7, name: '奎宿二(仙女座ζ)' },
      { ra: 10.125, dec: 29.002, brightness: 0.65, name: '奎宿三(仙女座ε)' },
      { ra: 17.440, dec: 35.620, brightness: 0.85, name: '奎宿九(仙女座β Mirach)' },
      { ra: 14.627, dec: 30.861, brightness: 0.55, name: '奎宿四(双鱼座σ)' },
      { ra: 16.738, dec: 33.367, brightness: 0.5, name: '奎宿五(双鱼座τ)' },
      { ra: 12.0, dec: 27.5, brightness: 0.45, name: '奎宿增一' }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 3], [2, 6]],
    color: 0xffd54f
  },
  {
    id: 'lou', name: '娄宿', pinyin: 'lousu', englishName: 'Bond', constellation: '西方白虎七宿',
    description: '娄宿三星，为白虎之腹，主苑牧、牺牲、祭祀、兴兵聚众。娄宿为牧苑之官，主牺牲、宗庙、社稷。',
    stars: [
      { ra: 29.083, dec: 20.804, brightness: 0.8, name: '娄宿一(白羊座β Sheratan)' },
      { ra: 31.794, dec: 23.467, brightness: 0.85, name: '娄宿二(白羊座α Hamal)' },
      { ra: 33.821, dec: 19.672, brightness: 0.7, name: '娄宿三(白羊座γ Mesarthim)' },
      { ra: 30.5, dec: 17.5, brightness: 0.5, name: '娄宿增一' },
      { ra: 35.0, dec: 22.0, brightness: 0.45, name: '娄宿增二' }
    ],
    connections: [[0, 1], [1, 2], [0, 2], [0, 3], [2, 4]],
    color: 0xffa726
  },
  {
    id: 'wei3', name: '胃宿', pinyin: 'wèisu', englishName: 'Stomach', constellation: '西方白虎七宿',
    description: '胃宿三星，为白虎之胸胃，主仓廪、五谷、府藏、积聚。胃宿为天子之仓，主五谷、丝帛、财物、库藏。',
    stars: [
      { ra: 42.483, dec: 27.431, brightness: 0.7, name: '胃宿一(白羊座35)' },
      { ra: 44.607, dec: 28.388, brightness: 0.65, name: '胃宿二(白羊座39)' },
      { ra: 46.783, dec: 29.008, brightness: 0.6, name: '胃宿三(白羊座41)' },
      { ra: 43.5, dec: 24.5, brightness: 0.5, name: '胃宿增一' },
      { ra: 48.0, dec: 26.5, brightness: 0.45, name: '胃宿增二' }
    ],
    connections: [[0, 1], [1, 2], [0, 2], [0, 3], [2, 4]],
    color: 0xff9800
  },
  {
    id: 'ang', name: '昴宿', pinyin: 'mǎosu', englishName: 'Pleiades', constellation: '西方白虎七宿',
    description: '昴宿七星，为白虎之毛，主髦头、胡兵、狱事、口舌。昴宿为旄头，主西方之宿，主丧、狱、胡、戎。',
    stars: [
      { ra: 55.504, dec: 24.468, brightness: 0.75, name: '昴宿一(金牛座17 Electra)' },
      { ra: 55.959, dec: 24.383, brightness: 0.7, name: '昴宿二(金牛座19 Taygeta)' },
      { ra: 56.421, dec: 24.313, brightness: 0.65, name: '昴宿四(金牛座20 Maia)' },
      { ra: 56.721, dec: 23.973, brightness: 0.72, name: '昴宿五(金牛座23 Merope)' },
      { ra: 56.871, dec: 24.105, brightness: 0.8, name: '昴宿六(金牛座22 Alcyone)' },
      { ra: 57.158, dec: 24.063, brightness: 0.6, name: '昴宿七(金牛座27 Atlas)' },
      { ra: 56.170, dec: 24.273, brightness: 0.55, name: '昴宿增一(金牛座21 Asterope)' }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [0, 6]],
    color: 0xfb8c00
  },
  {
    id: 'bi4', name: '毕宿', pinyin: 'bisù', englishName: 'Net', constellation: '西方白虎七宿',
    description: '毕宿八星，为白虎之爪，主畋猎、边兵、刑罚、雨师。毕宿为罕车，主弋猎、边兵、刑罚，毕星好雨。',
    stars: [
      { ra: 68.980, dec: 16.510, brightness: 0.95, name: '毕宿五(金牛座α Aldebaran)' },
      { ra: 67.121, dec: 18.903, brightness: 0.7, name: '毕宿一(金牛座ε Ain)' },
      { ra: 70.073, dec: 14.048, brightness: 0.65, name: '毕宿三(金牛座δ)' },
      { ra: 66.512, dec: 15.652, brightness: 0.6, name: '毕宿四(金牛座γ)' },
      { ra: 71.571, dec: 18.018, brightness: 0.55, name: '毕宿六(金牛座θ)' },
      { ra: 69.783, dec: 21.395, brightness: 0.5, name: '毕宿七(金牛座71)' },
      { ra: 64.967, dec: 12.572, brightness: 0.45, name: '毕宿八(金牛座λ)' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 4], [0, 5], [3, 6], [1, 5]],
    color: 0xf57c00
  },
  {
    id: 'zui', name: '觜宿', pinyin: 'zisu', englishName: 'Turtle Beak', constellation: '西方白虎七宿',
    description: '觜宿三星，为白虎之头口，主收敛、万物、军旅。觜宿为虎首，主军旅、收敛、葆旅、万物。',
    stars: [
      { ra: 79.169, dec: 9.938, brightness: 0.7, name: '觜宿一(猎户座λ Meissa)' },
      { ra: 80.321, dec: 9.388, brightness: 0.6, name: '觜宿二(猎户座φ)' },
      { ra: 78.585, dec: 10.414, brightness: 0.55, name: '觜宿三(猎户座ψ)' },
      { ra: 79.8, dec: 7.5, brightness: 0.45, name: '觜宿增一' },
      { ra: 77.8, dec: 11.2, brightness: 0.4, name: '觜宿增二' }
    ],
    connections: [[0, 1], [0, 2], [1, 2], [0, 3], [2, 4]],
    color: 0xef6c00
  },
  {
    id: 'shen', name: '参宿', pinyin: 'shensu', englishName: 'Orion', constellation: '西方白虎七宿',
    description: '参宿七星，为白虎之前身，主斩刈、权衡、大将。参宿为西方宿，主军事、征伐、杀伐，参宿七星中有三星为参宿腰带。',
    stars: [
      { ra: 78.634, dec: -8.202, brightness: 1.0, name: '参宿七(猎户座β Rigel)' },
      { ra: 88.793, dec: 7.407, brightness: 0.95, name: '参宿四(猎户座α Betelgeuse)' },
      { ra: 81.282, dec: 6.350, brightness: 0.85, name: '参宿五(猎户座γ Bellatrix)' },
      { ra: 83.001, dec: -0.299, brightness: 0.8, name: '参宿三(猎户座δ Mintaka)' },
      { ra: 84.053, dec: -1.202, brightness: 0.82, name: '参宿二(猎户座ε Alnilam)' },
      { ra: 85.198, dec: -1.943, brightness: 0.78, name: '参宿一(猎户座ζ Alnitak)' },
      { ra: 85.933, dec: -9.670, brightness: 0.7, name: '参宿六(猎户座κ Saiph)' }
    ],
    connections: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [2, 4], [3, 0]],
    color: 0xe65100
  },
  {
    id: 'jing', name: '井宿', pinyin: 'jingsu', englishName: 'Well', constellation: '南方朱雀七宿',
    description: '井宿八星，为朱雀之首，主水事、法令、酒旗。井宿为南门，主水衡、法令、公平、贤士。',
    stars: [
      { ra: 90.987, dec: 22.462, brightness: 0.7, name: '井宿一(双子座μ Tejat)' },
      { ra: 99.421, dec: 16.399, brightness: 0.85, name: '井宿三(双子座γ Alhena)' },
      { ra: 93.699, dec: 16.103, brightness: 0.75, name: '井宿五(双子座ε Mebsuta)' },
      { ra: 97.338, dec: 21.942, brightness: 0.65, name: '井宿四(双子座ξ)' },
      { ra: 97.951, dec: 22.659, brightness: 0.6, name: '井宿六(双子座δ Wasat)' },
      { ra: 101.758, dec: 20.610, brightness: 0.55, name: '井宿七(双子座ζ Mekbuda)' },
      { ra: 95.756, dec: 24.675, brightness: 0.5, name: '井宿八(双子座λ Propus)' },
      { ra: 104.5, dec: 18.0, brightness: 0.45, name: '井宿增一(双子座ν)' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [3, 4], [4, 5], [5, 7], [0, 6], [2, 4]],
    color: 0x4dd0e1
  },
  {
    id: 'gui', name: '鬼宿', pinyin: 'guǐsu', englishName: 'Ghost', constellation: '南方朱雀七宿',
    description: '鬼宿四星，为朱雀之目，主祠祀、死亡、疾病。鬼宿为天目，主祭祀、死亡、疾病、妖祥，中央一星为积尸气。',
    stars: [
      { ra: 126.271, dec: 18.965, brightness: 0.7, name: '鬼宿一(巨蟹座θ)' },
      { ra: 129.573, dec: 17.306, brightness: 0.65, name: '鬼宿二(巨蟹座η)' },
      { ra: 128.429, dec: 20.883, brightness: 0.6, name: '鬼宿三(巨蟹座γ)' },
      { ra: 131.567, dec: 14.772, brightness: 0.55, name: '鬼宿四(巨蟹座δ)' },
      { ra: 130.123, dec: 19.670, brightness: 0.5, name: '积尸气(M44 鬼星团)' },
      { ra: 127.5, dec: 15.5, brightness: 0.45, name: '鬼宿增一' }
    ],
    connections: [[0, 1], [0, 2], [1, 3], [0, 4], [1, 4], [2, 4], [3, 5]],
    color: 0x26c6da
  },
  {
    id: 'liu', name: '柳宿', pinyin: 'liǔsu', englishName: 'Willow', constellation: '南方朱雀七宿',
    description: '柳宿八星，为朱雀之喙，主草木、膳食、酒食。柳宿为朱雀之口，主饮食、仓库、庖厨、木果。',
    stars: [
      { ra: 135.875, dec: 5.418, brightness: 0.65, name: '柳宿一(长蛇座δ Mautinah)' },
      { ra: 137.479, dec: 3.275, brightness: 0.6, name: '柳宿二(长蛇座σ)' },
      { ra: 139.467, dec: -0.415, brightness: 0.55, name: '柳宿三(长蛇座η)' },
      { ra: 140.229, dec: -2.970, brightness: 0.5, name: '柳宿四(长蛇座ρ)' },
      { ra: 137.646, dec: -6.453, brightness: 0.58, name: '柳宿五(长蛇座ε)' },
      { ra: 139.065, dec: -8.222, brightness: 0.52, name: '柳宿六(长蛇座ζ)' },
      { ra: 134.492, dec: 7.363, brightness: 0.45, name: '柳宿七(长蛇座ω)' },
      { ra: 136.6, dec: 1.0, brightness: 0.4, name: '柳宿八(长蛇座θ)' }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [6, 1], [5, 7]],
    color: 0x00bcd4
  },
  {
    id: 'xing', name: '星宿', pinyin: 'xīngsù', englishName: 'Star', constellation: '南方朱雀七宿',
    description: '星宿七星，为朱雀之颈，主衣服、文章、太阳。星宿为七星，主衣裳、文绣、太阳、光明、贤士。',
    stars: [
      { ra: 141.936, dec: -8.674, brightness: 0.9, name: '星宿一(长蛇座α Alphard)' },
      { ra: 144.592, dec: -14.464, brightness: 0.65, name: '星宿二(长蛇座τ)' },
      { ra: 143.369, dec: -12.067, brightness: 0.6, name: '星宿三(长蛇座σ)' },
      { ra: 140.663, dec: -11.372, brightness: 0.55, name: '星宿四(长蛇座ν)' },
      { ra: 139.279, dec: -13.812, brightness: 0.5, name: '星宿五(长蛇座μ)' },
      { ra: 146.5, dec: -16.5, brightness: 0.48, name: '星宿六(长蛇座λ)' },
      { ra: 148.0, dec: -18.0, brightness: 0.42, name: '星宿七(长蛇座ι)' }
    ],
    connections: [[0, 1], [0, 2], [2, 3], [3, 4], [1, 5], [5, 6], [0, 3]],
    color: 0x00acc1
  },
  {
    id: 'zhang', name: '张宿', pinyin: 'zhāngsù', englishName: 'Extension', constellation: '南方朱雀七宿',
    description: '张宿六星，为朱雀之嗉，主珍宝、宗庙、天厨。张宿为朱雀之嗉，主宗庙、天子、嫔御、赏赐。',
    stars: [
      { ra: 147.837, dec: -14.835, brightness: 0.7, name: '张宿一(长蛇座υ1)' },
      { ra: 149.235, dec: -13.828, brightness: 0.65, name: '张宿二(长蛇座υ2)' },
      { ra: 151.0, dec: -16.5, brightness: 0.6, name: '张宿三' },
      { ra: 146.5, dec: -17.2, brightness: 0.55, name: '张宿四' },
      { ra: 149.8, dec: -18.0, brightness: 0.5, name: '张宿五' },
      { ra: 152.5, dec: -15.0, brightness: 0.45, name: '张宿六' }
    ],
    connections: [[0, 1], [1, 2], [0, 3], [2, 4], [4, 5], [1, 4]],
    color: 0x0097a7
  },
  {
    id: 'yi', name: '翼宿', pinyin: 'yisu', englishName: 'Wings', constellation: '南方朱雀七宿',
    description: '翼宿二十二星，为朱雀之翼翮，主俳倡、戏乐、蛮夷。翼宿为羽翼，主远夷、宾客、俳倡、戏乐、文章。',
    stars: [
      { ra: 156.860, dec: -18.305, brightness: 0.7, name: '翼宿一(巨爵座α Alkes)' },
      { ra: 154.027, dec: -19.953, brightness: 0.65, name: '翼宿二(巨爵座β)' },
      { ra: 157.760, dec: -19.562, brightness: 0.6, name: '翼宿三(巨爵座γ)' },
      { ra: 155.526, dec: -17.327, brightness: 0.55, name: '翼宿四(巨爵座δ)' },
      { ra: 158.888, dec: -16.800, brightness: 0.5, name: '翼宿五(巨爵座ε)' },
      { ra: 160.5, dec: -20.0, brightness: 0.48, name: '翼宿六(巨爵座ζ)' },
      { ra: 153.0, dec: -15.0, brightness: 0.42, name: '翼宿七(长蛇座ι)' }
    ],
    connections: [[0, 1], [1, 3], [3, 0], [0, 2], [2, 4], [4, 5], [3, 6], [6, 1]],
    color: 0x00838f
  },
  {
    id: 'zhen', name: '轸宿', pinyin: 'zhěnsù', englishName: 'Chariot', constellation: '南方朱雀七宿',
    description: '轸宿四星，为朱雀之尾，主车骑、载任、丧葬。轸宿为车，主载任、有司、大车、丧事、冢宰。',
    stars: [
      { ra: 173.559, dec: -17.485, brightness: 0.8, name: '轸宿一(乌鸦座γ Gienah)' },
      { ra: 174.629, dec: -22.770, brightness: 0.65, name: '轸宿二(乌鸦座ε)' },
      { ra: 177.094, dec: -17.250, brightness: 0.6, name: '轸宿三(乌鸦座δ)' },
      { ra: 176.631, dec: -23.402, brightness: 0.7, name: '轸宿四(乌鸦座β Kraz)' },
      { ra: 179.673, dec: -24.111, brightness: 0.55, name: '轸宿五(乌鸦座α Alchiba)' },
      { ra: 175.5, dec: -20.0, brightness: 0.48, name: '轸宿增一' },
      { ra: 178.0, dec: -21.5, brightness: 0.42, name: '轸宿增二' }
    ],
    connections: [[0, 1], [1, 3], [3, 2], [2, 0], [3, 4], [0, 5], [4, 6], [2, 6]],
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

  private createGlowLine(from: THREE.Vector3, to: THREE.Vector3): THREE.Group {
    const lineGroup = new THREE.Group();
    
    const curve = new THREE.QuadraticBezierCurve3(
      from,
      from.clone().add(to).multiplyScalar(0.5).normalize().multiplyScalar(SPHERE_RADIUS * 1.05),
      to
    );
    const pointsOnCurve = curve.getPoints(20);

    const layerConfigs = [
      { linewidth: 4, opacity: 0.15 },
      { linewidth: 2, opacity: 0.3 },
      { linewidth: 1, opacity: 0.6 }
    ];

    layerConfigs.forEach(config => {
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pointsOnCurve);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xccccff,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.userData.lineWidth = config.linewidth;
      lineGroup.add(line);
    });

    return lineGroup;
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

        const size = DEFAULT_STAR_SIZE;
        localSizes[i] = size;
        this.allStarSizes[globalIndex] = size;

        globalIndex++;
      });

      const pointGeom = new THREE.BufferGeometry();
      pointGeom.setAttribute('position', new THREE.BufferAttribute(localPositions, 3));
      pointGeom.setAttribute('color', new THREE.BufferAttribute(localColors, 3));

      const pointMat = new THREE.PointsMaterial({
        size: DEFAULT_STAR_SIZE,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const points = new THREE.Points(pointGeom, pointMat);
      group.add(points);

      const glowPointGeom = new THREE.BufferGeometry();
      const glowPositions = new Float32Array(officialData.stars.length * 3);
      const glowColors = new Float32Array(officialData.stars.length * 3);
      
      for (let i = 0; i < officialData.stars.length; i++) {
        glowPositions[i * 3] = localPositions[i * 3];
        glowPositions[i * 3 + 1] = localPositions[i * 3 + 1];
        glowPositions[i * 3 + 2] = localPositions[i * 3 + 2];
        
        glowColors[i * 3] = baseColor.r * 0.5;
        glowColors[i * 3 + 1] = baseColor.g * 0.5;
        glowColors[i * 3 + 2] = baseColor.b * 0.5;
      }
      
      glowPointGeom.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
      glowPointGeom.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
      
      const glowPointMat = new THREE.PointsMaterial({
        size: DEFAULT_STAR_SIZE * 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      
      const glowPoints = new THREE.Points(glowPointGeom, glowPointMat);
      group.add(glowPoints);

      const lines: THREE.Line[] = [];
      officialData.connections.forEach(([from, to]) => {
        if (from < positions.length && to < positions.length) {
          const lineGroup = this.createGlowLine(positions[from], positions[to]);
          lineGroup.children.forEach(child => {
            if (child instanceof THREE.Line) {
              lines.push(child);
            }
          });
          group.add(lineGroup);
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
        glowPoints,
        lines,
        label,
        originalColors: new Float32Array(localColors),
        targetSize: DEFAULT_STAR_SIZE,
        currentSize: DEFAULT_STAR_SIZE
      };

      this.starOfficials.push(official);
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
        off.targetSize = HOVER_STAR_SIZE;
      } else {
        labelEl.classList.remove('hovered');
        if (off.targetSize === HOVER_STAR_SIZE) {
          off.targetSize = DEFAULT_STAR_SIZE;
        }
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
        off.targetSize = HIGHLIGHT_STAR_SIZE;
        off.lines.forEach(line => {
          (line.material as THREE.LineBasicMaterial).opacity = 0.8;
          (line.material as THREE.LineBasicMaterial).color.setHex(0xffd700);
        });
      } else {
        colorArray.set(off.originalColors);
        off.targetSize = DEFAULT_STAR_SIZE;
        off.lines.forEach(line => {
          (line.material as THREE.LineBasicMaterial).opacity = 
            line.userData.lineWidth === 4 ? 0.15 :
            line.userData.lineWidth === 2 ? 0.3 : 0.6;
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

      official.currentSize = THREE.MathUtils.lerp(
        official.currentSize,
        official.targetSize,
        LERP_FACTOR
      );
      (official.points.material as THREE.PointsMaterial).size = official.currentSize;
      (official.glowPoints.material as THREE.PointsMaterial).size = official.currentSize * 2.5;
    });
  }

  public resize(width: number, height: number): void {
    this.labelRenderer.setSize(width, height);
  }

  private getPinyinInitials(pinyin: string): string {
    return pinyin
      .replace(/[āáǎà]/g, 'a')
      .replace(/[ōóǒò]/g, 'o')
      .replace(/[ēéěè]/g, 'e')
      .replace(/[īíǐì]/g, 'i')
      .replace(/[ūúǔù]/g, 'u')
      .replace(/[ǖǘǚǜ]/g, 'v')
      .replace(/[^a-zA-Z]/g, '')
      .charAt(0);
  }

  private fuzzyMatchPinyin(query: string, pinyin: string): boolean {
    const lowerQuery = query.toLowerCase();
    const cleanPinyin = pinyin
      .toLowerCase()
      .replace(/[āáǎà]/g, 'a')
      .replace(/[ōóǒò]/g, 'o')
      .replace(/[ēéěè]/g, 'e')
      .replace(/[īíǐì]/g, 'i')
      .replace(/[ūúǔù]/g, 'u')
      .replace(/[ǖǘǚǜü]/g, 'v');

    if (cleanPinyin.includes(lowerQuery)) return true;

    const initials = cleanPinyin.split(/[^a-z]/).filter(Boolean).map(s => s[0]).join('');
    if (initials.includes(lowerQuery)) return true;

    let queryIdx = 0;
    for (let i = 0; i < cleanPinyin.length && queryIdx < lowerQuery.length; i++) {
      if (cleanPinyin[i] === lowerQuery[queryIdx]) {
        queryIdx++;
      }
    }
    if (queryIdx === lowerQuery.length) return true;

    return false;
  }

  private fuzzyMatchEnglish(query: string, englishName: string): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerEnglish = englishName.toLowerCase();

    if (lowerEnglish.includes(lowerQuery)) return true;

    const englishWords = lowerEnglish.split(/\s+/);
    const matchAnyWord = englishWords.some(word => word.startsWith(lowerQuery));
    if (matchAnyWord) return true;

    let queryIdx = 0;
    for (let i = 0; i < lowerEnglish.length && queryIdx < lowerQuery.length; i++) {
      if (lowerEnglish[i] === lowerQuery[queryIdx]) {
        queryIdx++;
      }
    }
    if (queryIdx === lowerQuery.length) return true;

    const initials = englishWords.map(w => w[0]).join('');
    if (initials.includes(lowerQuery)) return true;

    return false;
  }

  public searchStarOfficials(query: string): StarOfficial[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    const isChinese = /[\u4e00-\u9fa5]/.test(query);

    const results = this.starOfficials.filter(off => {
      if (isChinese) {
        return off.data.name.includes(query) ||
          off.data.constellation.includes(query);
      } else {
        return this.fuzzyMatchPinyin(query, off.data.pinyin) ||
          this.fuzzyMatchPinyin(query, off.data.name) ||
          this.fuzzyMatchEnglish(query, off.data.englishName) ||
          off.data.constellation.includes(query);
      }
    });

    results.sort((a, b) => {
      const aExact = a.data.englishName.toLowerCase() === lowerQuery ? -1 :
                     a.data.name.startsWith(query) ? 0 : 1;
      const bExact = b.data.englishName.toLowerCase() === lowerQuery ? -1 :
                     b.data.name.startsWith(query) ? 0 : 1;
      return aExact - bExact;
    });

    return results.slice(0, 8);
  }

  public getCenterPosition(official: StarOfficial): THREE.Vector3 {
    const center = new THREE.Vector3();
    official.positions.forEach(p => center.add(p));
    center.multiplyScalar(1 / official.positions.length);
    return center;
  }
}
