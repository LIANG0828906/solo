export const ASPECT_RATIO = 16 / 9;
export const MIN_FLOW_RATE = 0.5;
export const MAX_FLOW_RATE = 3.0;
export const FLOW_STEP = 0.1;
export const PIVOT_DIAMETER = 100;
export const CELESTIAL_DIAMETER = 200;
export const SIGHT_TUBE_LENGTH = 150;
export const GEAR_RATIO = 3.6;
export const MAX_ERROR_ANGLE = 5;
export const ERROR_THRESHOLD = 2;
export const TANK_WIDTH = 500;
export const TANK_HEIGHT = 60;
export const PIVOT_STEP_ANGLE = 30;
export const WATER_LEVEL_THRESHOLD = 75;
export const STATE_UPDATE_INTERVAL = 16;
export const MIN_PARTICLES = 20;
export const MAX_PARTICLES = 120;
export const BLINK_PERIOD = 300;
export const SPARK_DURATION = 200;
export const TRANSMISSION_RATIO = 10;

export const COLORS = {
  backgroundStart: '#0a0a2a',
  backgroundEnd: '#1a1a4a',
  bronze: '#b8860b',
  gold: '#ffd700',
  woodLight: '#a0784a',
  woodDark: '#6b4e2e',
  woodDeep: '#5a3e1a',
  bronzeLight: '#d4a843',
  bronzeDark: '#8b6914',
  bronzeSlider: '#c8a742',
  water: '#4da6ff',
  waterLight: '#87ceeb',
  starWhite: '#ffffff',
  starBlue: '#87ceeb',
  sightTube: '#ff0000',
  crosshairGreen: '#00ff00',
  crosshairRed: '#ff0000',
  celestialBlue: '#87ceeb',
  spark: '#ffd700',
} as const;

export const TWENTY_EIGHT_STARS = [
  { name: '角宿一', ra: 201.29, dec: -11.16, brightness: 0.97 },
  { name: '角宿二', ra: 202.54, dec: -12.34, brightness: 3.2 },
  { name: '亢宿一', ra: 205.91, dec: -9.58, brightness: 4.48 },
  { name: '亢宿二', ra: 207.89, dec: -10.43, brightness: 4.32 },
  { name: '亢宿三', ra: 209.56, dec: -8.68, brightness: 4.68 },
  { name: '亢宿四', ra: 210.27, dec: -7.56, brightness: 5.36 },
  { name: '氐宿一', ra: 215.07, dec: -8.66, brightness: 2.84 },
  { name: '氐宿二', ra: 216.43, dec: -9.34, brightness: 4.92 },
  { name: '氐宿三', ra: 217.91, dec: -5.06, brightness: 3.6 },
  { name: '氐宿四', ra: 219.37, dec: -8.78, brightness: 2.79 },
  { name: '房宿一', ra: 222.16, dec: -6.43, brightness: 3.65 },
  { name: '房宿二', ra: 223.48, dec: -5.68, brightness: 4.58 },
  { name: '房宿三', ra: 224.49, dec: -4.98, brightness: 2.74 },
  { name: '房宿四', ra: 225.32, dec: -3.69, brightness: 4.79 },
  { name: '心宿一', ra: 227.33, dec: -2.48, brightness: 2.94 },
  { name: '心宿二', ra: 228.82, dec: -26.43, brightness: 1.09 },
  { name: '心宿三', ra: 230.01, dec: -4.87, brightness: 3.07 },
  { name: '尾宿一', ra: 233.87, dec: -5.68, brightness: 4.88 },
  { name: '尾宿二', ra: 234.98, dec: -7.55, brightness: 3.49 },
  { name: '尾宿三', ra: 236.45, dec: -8.89, brightness: 4.22 },
  { name: '尾宿四', ra: 237.21, dec: -9.68, brightness: 4.67 },
  { name: '尾宿五', ra: 238.32, dec: -10.21, brightness: 2.54 },
  { name: '尾宿六', ra: 239.76, dec: -11.15, brightness: 3.39 },
  { name: '尾宿七', ra: 240.92, dec: -12.34, brightness: 3.71 },
  { name: '尾宿八', ra: 242.18, dec: -13.78, brightness: 2.62 },
  { name: '尾宿九', ra: 243.12, dec: -14.67, brightness: 4.05 },
  { name: '箕宿一', ra: 245.23, dec: -15.34, brightness: 3.24 },
  { name: '箕宿二', ra: 246.87, dec: -16.78, brightness: 2.92 },
  { name: '箕宿三', ra: 248.45, dec: -17.92, brightness: 3.67 },
  { name: '箕宿四', ra: 249.83, dec: -19.23, brightness: 4.45 },
  { name: '斗宿一', ra: 255.67, dec: -21.34, brightness: 2.89 },
  { name: '斗宿二', ra: 257.23, dec: -22.45, brightness: 3.32 },
  { name: '斗宿三', ra: 258.91, dec: -23.67, brightness: 4.12 },
  { name: '斗宿四', ra: 260.12, dec: -24.89, brightness: 3.07 },
  { name: '斗宿五', ra: 261.78, dec: -25.78, brightness: 3.87 },
  { name: '斗宿六', ra: 263.23, dec: -26.91, brightness: 4.23 },
  { name: '牛宿一', ra: 268.45, dec: -28.12, brightness: 3.12 },
  { name: '牛宿二', ra: 270.12, dec: -29.34, brightness: 4.56 },
  { name: '女宿一', ra: 275.67, dec: -30.12, brightness: 3.78 },
  { name: '女宿二', ra: 277.23, dec: -31.45, brightness: 4.89 },
  { name: '虚宿一', ra: 282.89, dec: -32.67, brightness: 2.91 },
  { name: '虚宿二', ra: 284.56, dec: -33.89, brightness: 4.34 },
  { name: '危宿一', ra: 290.12, dec: -35.12, brightness: 3.45 },
  { name: '危宿二', ra: 291.78, dec: -36.34, brightness: 4.12 },
  { name: '危宿三', ra: 293.23, dec: -37.56, brightness: 3.78 },
  { name: '室宿一', ra: 298.67, dec: -38.78, brightness: 2.78 },
  { name: '室宿二', ra: 300.12, dec: -39.89, brightness: 3.56 },
  { name: '壁宿一', ra: 305.45, dec: -41.12, brightness: 3.12 },
  { name: '壁宿二', ra: 307.23, dec: -42.34, brightness: 2.89 },
  { name: '奎宿一', ra: 312.67, dec: -43.56, brightness: 3.45 },
  { name: '奎宿二', ra: 314.12, dec: -44.78, brightness: 4.23 },
  { name: '娄宿一', ra: 318.89, dec: -46.12, brightness: 2.67 },
  { name: '娄宿二', ra: 320.45, dec: -47.34, brightness: 3.89 },
  { name: '娄宿三', ra: 322.12, dec: -48.56, brightness: 3.34 },
  { name: '胃宿一', ra: 327.67, dec: -49.78, brightness: 3.12 },
  { name: '胃宿二', ra: 329.23, dec: -50.89, brightness: 4.45 },
  { name: '胃宿三', ra: 330.78, dec: -52.12, brightness: 3.67 },
  { name: '昴宿一', ra: 336.12, dec: -53.34, brightness: 2.98 },
  { name: '昴宿二', ra: 337.78, dec: -54.56, brightness: 4.12 },
  { name: '毕宿一', ra: 342.45, dec: -55.78, brightness: 3.45 },
  { name: '毕宿二', ra: 344.12, dec: -56.89, brightness: 3.78 },
  { name: '毕宿三', ra: 345.78, dec: -58.12, brightness: 4.23 },
  { name: '觜宿一', ra: 350.23, dec: -59.34, brightness: 2.89 },
  { name: '觜宿二', ra: 351.67, dec: -60.56, brightness: 3.56 },
  { name: '参宿一', ra: 356.89, dec: -61.78, brightness: 1.78 },
  { name: '参宿二', ra: 358.45, dec: -62.89, brightness: 2.34 },
  { name: '参宿三', ra: 359.89, dec: -64.12, brightness: 2.23 },
  { name: '参宿四', ra: 361.23, dec: -65.34, brightness: 0.45 },
  { name: '参宿五', ra: 362.78, dec: -66.56, brightness: 1.64 },
  { name: '参宿六', ra: 364.12, dec: -67.78, brightness: 2.06 },
  { name: '参宿七', ra: 365.45, dec: -68.89, brightness: 0.13 },
  { name: '井宿一', ra: 370.67, dec: -70.12, brightness: 3.12 },
  { name: '井宿二', ra: 372.23, dec: -71.34, brightness: 4.23 },
  { name: '鬼宿一', ra: 377.89, dec: -72.56, brightness: 3.45 },
  { name: '鬼宿二', ra: 379.45, dec: -73.78, brightness: 4.56 },
  { name: '柳宿一', ra: 384.12, dec: -75.12, brightness: 3.78 },
  { name: '柳宿二', ra: 385.78, dec: -76.34, brightness: 4.12 },
  { name: '星宿一', ra: 390.23, dec: -77.56, brightness: 1.98 },
  { name: '星宿二', ra: 391.67, dec: -78.78, brightness: 3.34 },
  { name: '张宿一', ra: 396.89, dec: -80.12, brightness: 3.12 },
  { name: '张宿二', ra: 398.45, dec: -81.34, brightness: 4.23 },
  { name: '翼宿一', ra: 403.12, dec: -82.56, brightness: 2.89 },
  { name: '翼宿二', ra: 404.78, dec: -83.78, brightness: 3.45 },
  { name: '轸宿一', ra: 409.23, dec: -85.12, brightness: 2.78 },
  { name: '轸宿二', ra: 410.67, dec: -86.34, brightness: 3.12 },
  { name: '轸宿三', ra: 412.23, dec: -87.56, brightness: 3.89 },
  { name: '轸宿四', ra: 413.78, dec: -88.78, brightness: 4.23 },
] as const;
