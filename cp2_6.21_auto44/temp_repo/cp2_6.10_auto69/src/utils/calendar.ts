export interface SolarTermData {
  name: string;
  gnomonAngle: number;
  sunMaxAltitude: number;
  sunAzimuthRange: number;
  lightColor: string;
  shadowOpacity: number;
}

export interface ShichenData {
  index: number;
  name: string;
  modernStart: number;
  modernEnd: number;
  zodiac: string;
}

export interface ProjectionResult {
  x: number;
  z: number;
  length: number;
  direction: number;
}

export interface TimeInfo {
  shichenIndex: number;
  shichenName: string;
  ke: number;
  modernTime: string;
  dayProgress: number;
}

export const SHICHEN_NAMES: string[] = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥"
];

export const ZODIAC_NAMES: string[] = [
  "鼠", "牛", "虎", "兔", "龙", "蛇",
  "马", "羊", "猴", "鸡", "狗", "猪"
];

export const SHICHEN_DATA: ShichenData[] = SHICHEN_NAMES.map((name, index) => {
  const startHour = (index * 2 + 23) % 24;
  const endHour = (index * 2 + 1) % 24;
  return {
    index,
    name,
    modernStart: startHour,
    modernEnd: endHour,
    zodiac: ZODIAC_NAMES[index]
  };
});

const SOLAR_TERM_NAMES: string[] = [
  "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰",
  "春分", "清明", "谷雨", "立夏", "小满", "芒种",
  "夏至", "小暑", "大暑", "立秋", "处暑", "白露",
  "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const calculateSolarTermValue = (index: number, min: number, max: number): number => {
  if (index <= 12) {
    return lerp(min, max, index / 12);
  } else {
    return lerp(max, min, (index - 12) / 12);
  }
};

const parseColor = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

export const SOLAR_TERMS: SolarTermData[] = SOLAR_TERM_NAMES.map((name, index) => {
  const gnomonAngle = calculateSolarTermValue(index, 67.5, 112.5);
  const sunMaxAltitude = calculateSolarTermValue(index, 27, 73);
  const sunAzimuthRange = calculateSolarTermValue(index, 90, 150);
  const colorT = index <= 12 ? index / 12 : (24 - index) / 12;
  const [r1, g1, b1] = parseColor('#a4b4be');
  const [r2, g2, b2] = parseColor('#f5deb3');
  const lightColor = rgbToHex(
    lerp(r1, r2, colorT),
    lerp(g1, g2, colorT),
    lerp(b1, b2, colorT)
  );
  const shadowOpacity = lerp(0.8, 0.4, colorT);
  
  return {
    name,
    gnomonAngle,
    sunMaxAltitude,
    sunAzimuthRange,
    lightColor,
    shadowOpacity
  };
});

export const degToRad = (deg: number): number => deg * Math.PI / 180;

export const radToDeg = (rad: number): number => rad * 180 / Math.PI;

export { lerp };

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);
  return rgbToHex(
    lerp(r1, r2, t),
    lerp(g1, g2, t),
    lerp(b1, b2, t)
  );
};

export const getSolarTermData = (index: number): SolarTermData => {
  const clampedIndex = ((index % 24) + 24) % 24;
  const floorIndex = Math.floor(clampedIndex);
  const ceilIndex = (floorIndex + 1) % 24;
  const t = clampedIndex - floorIndex;
  
  const a = SOLAR_TERMS[floorIndex];
  const b = SOLAR_TERMS[ceilIndex];
  
  return {
    name: t < 0.5 ? a.name : b.name,
    gnomonAngle: lerp(a.gnomonAngle, b.gnomonAngle, t),
    sunMaxAltitude: lerp(a.sunMaxAltitude, b.sunMaxAltitude, t),
    sunAzimuthRange: lerp(a.sunAzimuthRange, b.sunAzimuthRange, t),
    lightColor: lerpColor(a.lightColor, b.lightColor, t),
    shadowOpacity: lerp(a.shadowOpacity, b.shadowOpacity, t)
  };
};

export const calculateProjection = (
  gnomonAngle: number,
  sunAngle: number,
  sunMaxAltitude: number,
  sunAzimuthRange: number,
  gnomonHeight: number = 8
): ProjectionResult => {
  const sunAltitudeRadRaw = degToRad(sunMaxAltitude) * Math.sin(degToRad(sunAngle));
  const sunAltitude = radToDeg(sunAltitudeRadRaw);
  
  const normalizedSunAngle = (sunAngle / 180) * 2 - 1;
  const sunAzimuth = normalizedSunAngle * (sunAzimuthRange / 2);
  
  const gnomonAngleRad = degToRad(gnomonAngle);
  const gnomonTipX = 0;
  const gnomonTipY = Math.sin(gnomonAngleRad) * gnomonHeight;
  const gnomonTipZ = Math.cos(gnomonAngleRad) * gnomonHeight;
  
  const sunAltitudeRad = degToRad(sunAltitude);
  const sunAzimuthRad = degToRad(sunAzimuth);
  
  const lightDirX = Math.cos(sunAltitudeRad) * Math.sin(sunAzimuthRad);
  const lightDirY = Math.sin(sunAltitudeRad);
  const lightDirZ = Math.cos(sunAltitudeRad) * Math.cos(sunAzimuthRad);
  
  const t = -gnomonTipY / lightDirY;
  
  const shadowX = gnomonTipX + lightDirX * t;
  const shadowZ = gnomonTipZ + lightDirZ * t;
  
  const length = Math.sqrt(shadowX * shadowX + shadowZ * shadowZ);
  const direction = Math.atan2(shadowX, shadowZ);
  
  return {
    x: shadowX,
    z: shadowZ,
    length,
    direction
  };
};

export const calculateTimeInfo = (
  sunAngle: number,
  solarTermIndex: number
): TimeInfo => {
  const solarTerm = getSolarTermData(solarTermIndex);
  const clampedSunAngle = Math.max(0, Math.min(180, sunAngle));
  const dayProgress = clampedSunAngle / 180;
  
  const dayStartShichenIndex = 3;
  const degreesPerShichen = 15;
  const degreesPerKe = 1.875;
  
  const offsetAngle = clampedSunAngle;
  const shichenOffset = Math.floor(offsetAngle / degreesPerShichen);
  const shichenIndex = (dayStartShichenIndex + shichenOffset) % 12;
  const shichenName = SHICHEN_NAMES[shichenIndex];
  
  const keAngle = offsetAngle % degreesPerShichen;
  const ke = Math.floor(keAngle / degreesPerKe);
  
  const azimuthFactor = solarTerm.sunAzimuthRange / 120;
  const baseStartHour = SHICHEN_DATA[shichenIndex].modernStart;
  const adjustedStartHour = 6 + (baseStartHour - 6) * azimuthFactor;
  const minutesInShichen = ke * 24;
  const totalMinutes = adjustedStartHour * 60 + minutesInShichen;
  const adjustedTotalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(adjustedTotalMinutes / 60);
  const minutes = Math.floor(adjustedTotalMinutes % 60);
  const modernTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return {
    shichenIndex,
    shichenName,
    ke,
    modernTime,
    dayProgress
  };
};
